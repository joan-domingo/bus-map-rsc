import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { gunzipSync } from "node:zlib";

/**
 * downloadData.ts is a top-level script: importing it runs the whole download.
 * Each test therefore stands in a fake network and a fake filesystem, then
 * imports a fresh copy of the module.
 */
const SCRIPT = "../downloadData";

const busLine = {
  nid: "1",
  ID_LINEA: "68",
  COD_LINEA: "N-80",
  DESC_LINEA: "Barcelona - Cerdanyola",
  ID_ZONA: "1",
  ID_SUBZONA: "1",
  TREAL: "S",
  FORMA: "redondo",
  COLOR: "#1E003C",
  ADAPTADA: "S",
  MARCA: "Moventis",
  DIAS_QUE_CIRCULA: "LMXJV",
};

const secondBusLine = { ...busLine, ID_LINEA: "59", COD_LINEA: "C-30" };

function rawStop(id: number, name: string, lineId = 68) {
  return {
    ID_LINEA: lineId,
    ID_PARADA: id,
    Parada: {
      DESC_PARADA: name,
      LATITUD: 41.5,
      LONGITUD: 2.1,
      ID_ZONA: 4,
    },
  };
}

let files: Map<string, string>;
let fetchCalls: string[];
let logs: unknown[][];
let errors: unknown[][];
let restore: () => void;

/**
 * Installs fake fetch, Bun.write, Bun.file and console for one script run.
 * `failWriteFor` makes a write blow up, to exercise the script's error path.
 */
function install(
  routes: (url: string) => unknown,
  failWriteFor?: (path: string) => boolean,
) {
  files = new Map();
  fetchCalls = [];
  logs = [];
  errors = [];

  const realFetch = globalThis.fetch;
  const realWrite = Bun.write;
  const realFile = Bun.file;
  const realLog = console.log;
  const realError = console.error;

  globalThis.fetch = mock(async (input: string | URL | Request) => {
    const url = String(input);
    fetchCalls.push(url);
    return { json: async () => routes(url) } as unknown as Response;
  }) as unknown as typeof fetch;

  // biome-ignore lint/suspicious/noExplicitAny: patching the Bun namespace for the test
  (Bun as any).write = mock(async (path: string, contents: unknown) => {
    if (failWriteFor?.(path)) {
      throw new Error(`disk full: ${path}`);
    }
    files.set(
      path,
      contents instanceof Uint8Array
        ? gunzipSync(Buffer.from(contents)).toString("utf-8")
        : String(contents),
    );
    return 0;
  });
  // biome-ignore lint/suspicious/noExplicitAny: patching the Bun namespace for the test
  (Bun as any).file = mock((path: string) => ({
    text: async () => {
      const contents = files.get(path);
      if (contents === undefined) {
        throw new Error(`ENOENT: ${path}`);
      }
      return contents;
    },
  }));
  console.log = (...args: unknown[]) => logs.push(args);
  console.error = (...args: unknown[]) => errors.push(args);

  restore = () => {
    globalThis.fetch = realFetch;
    // biome-ignore lint/suspicious/noExplicitAny: restoring the Bun namespace
    (Bun as any).write = realWrite;
    // biome-ignore lint/suspicious/noExplicitAny: restoring the Bun namespace
    (Bun as any).file = realFile;
    console.log = realLog;
    console.error = realError;
  };
}

let hasRun = false;

/**
 * Runs the script. The first run imports it by its real specifier; later runs
 * add a cache-busting query so the module registry re-evaluates the top-level
 * body instead of returning the finished module.
 */
async function runScript() {
  if (hasRun) {
    await import(`${SCRIPT}?run=${Math.random()}`);
    return;
  }
  await import("../downloadData");
  hasRun = true;
}

function readJson(path: string) {
  return JSON.parse(files.get(path) ?? "null");
}

describe("downloadData", () => {
  beforeEach(() => {
    process.env.__DOWNLOAD_DATA_TEST__ = "1";
  });

  afterEach(() => {
    restore?.();
  });

  it("skips journey entries that carry no stop id", async () => {
    install((url) => {
      if (url.endsWith("/lines")) {
        return [busLine];
      }
      return [
        {
          TrayectosDet: [
            rawStop(1, "Parada 1"),
            { Parada: { DESC_PARADA: "Sense id" } },
            null,
          ],
        },
      ];
    });

    await runScript();

    expect(readJson("public/stops/68.json")).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  it("logs and stops when the line list cannot be downloaded", async () => {
    install(() => {
      throw new Error("network down");
    });

    await runScript();

    expect(errors[0]?.[0]).toBe("Error:");
    expect(files.size).toBe(0);
  });

  describe("a full run over two lines", () => {
    beforeEach(async () => {
      install((url) => {
        if (url.endsWith("/lines")) {
          return [busLine, secondBusLine];
        }
        if (url.includes("/GetTrayectos/68/")) {
          return [
            { TrayectosDet: [rawStop(1, "Parada 1"), rawStop(2, "Parada 2")] },
            // The same stop appears on both journeys of the line
            { TrayectosDet: [rawStop(1, "Parada 1")] },
          ];
        }
        return [
          {
            TrayectosDet: [
              rawStop(2, "Parada 2", 59),
              rawStop(3, "Parada 3", 59),
            ],
          },
        ];
      });
      await runScript();
    });

    // The script keys lines by their numeric id, so JavaScript orders them
    // numerically ("59" before "68") no matter what order they arrived in.
    it("downloads the line list and one journey file per line", () => {
      expect(fetchCalls).toEqual([
        "https://www.moventis.es/es/moventis/ca/lines",
        "https://www.moventis.es/api/json/GetTrayectos/59/LMXJV",
        "https://www.moventis.es/api/json/GetTrayectos/68/LMXJV",
      ]);
    });

    it("keys the raw line list by line id", () => {
      expect(Object.keys(readJson("data/bus-lines.json"))).toEqual([
        "59",
        "68",
      ]);
      expect(readJson("data/bus-lines.json")["68"]).toEqual(busLine);
      expect(readJson("data/68.json")).toHaveLength(2);
    });

    it("flattens each line's journeys into a deduplicated stop list", () => {
      const stopIds = (path: string) =>
        readJson(path).map((stop: { ID_PARADA: number }) => stop.ID_PARADA);

      // Stop 1 appears on both journeys of line 68 but is written once
      expect(stopIds("public/stops/68.json")).toEqual([1, 2]);
      expect(stopIds("public/stops/59.json")).toEqual([2, 3]);
    });

    it("writes every stop once, tagged with the lines that serve it", () => {
      const allStops = JSON.parse(
        files.get("public/stops/all.json.gz") ?? "[]",
      );

      // A stop shared by two lines keeps its position but takes its scalar
      // fields from the last line that listed it
      expect(allStops).toEqual([
        {
          id: 2,
          name: "Parada 2",
          lat: 41.5,
          lon: 2.1,
          buses: ["59", "68"],
          lineId: 68,
          zoneId: 4,
        },
        {
          id: 3,
          name: "Parada 3",
          lat: 41.5,
          lon: 2.1,
          buses: ["59"],
          lineId: 59,
          zoneId: 4,
        },
        {
          id: 1,
          name: "Parada 1",
          lat: 41.5,
          lon: 2.1,
          buses: ["68"],
          lineId: 68,
          zoneId: 4,
        },
      ]);
    });

    it("gzips the all-stops archive", () => {
      // install() gunzips whatever the script writes, so a readable JSON body
      // here proves the archive was compressed
      expect(() =>
        JSON.parse(files.get("public/stops/all.json.gz") ?? ""),
      ).not.toThrow();
    });

    it("writes the name and color lookup the app renders badges from", () => {
      expect(readJson("lib/utils/busLineData.json")).toEqual({
        "59": { name: "C-30", color: "#1E003C" },
        "68": { name: "N-80", color: "#1E003C" },
      });
    });

    it("reports progress and completion", () => {
      const messages = logs.map((entry) => entry[0]);
      expect(messages[0]).toBe("Downloading all bus lines data...");
      expect(messages).toContain(
        "All bus lines data downloaded and prepared successfully.",
      );
      expect(errors).toEqual([]);
    });
  });

  // Runs last on purpose: coverage reports the script's final evaluation, and
  // only a run that gets all the way to the last write before failing walks
  // both the happy path and the catch block in one go.
  it("logs a failure that happens after most of the work is done", async () => {
    install(
      (url) => {
        if (url.endsWith("/lines")) {
          return [busLine];
        }
        return [{ TrayectosDet: [rawStop(1, "Parada 1")] }];
      },
      (path) => path === "lib/utils/busLineData.json",
    );

    await runScript();

    expect(files.has("public/stops/all.json.gz")).toBe(true);
    expect(files.has("lib/utils/busLineData.json")).toBe(false);
    expect(errors[0]?.[0]).toBe("Error:");
    expect((errors[0]?.[1] as Error).message).toBe(
      "disk full: lib/utils/busLineData.json",
    );
  });
});
