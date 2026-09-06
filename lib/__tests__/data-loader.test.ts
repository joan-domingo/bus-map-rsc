import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { loadAllBusStops, loadBusStopsForLineIds } from "../data-loader";
import type { BusStop } from "../types";

/**
 * The loader resolves paths from process.cwd(), so each test points cwd at a
 * throwaway directory holding exactly the public/stops fixtures it needs.
 */
const fixtureRoot = mkdtempSync(join(tmpdir(), "bus-map-data-loader-"));
const stopsDir = join(fixtureRoot, "public", "stops");
const emptyRoot = mkdtempSync(join(tmpdir(), "bus-map-data-loader-empty-"));

const realCwd = process.cwd;

function withCwd<T>(dir: string, run: () => T): T {
  process.cwd = () => dir;
  try {
    return run();
  } finally {
    process.cwd = realCwd;
  }
}

function rawStop(overrides: Record<string, unknown> = {}) {
  return {
    ID_LINEA: 1,
    ID_PARADA: 100,
    Parada: {
      DESC_PARADA: "Plaça Major",
      LATITUD: 41.49,
      LONGITUD: 2.14,
      ID_ZONA: 3,
    },
    ...overrides,
  };
}

const allStopsFixture: BusStop[] = [
  {
    id: 100,
    name: "Plaça Major",
    lat: 41.49,
    lon: 2.14,
    buses: ["1"],
    lineId: 1,
    zoneId: 3,
  },
];

beforeAll(() => {
  mkdirSync(stopsDir, { recursive: true });
  writeFileSync(
    join(stopsDir, "all.json.gz"),
    gzipSync(Buffer.from(JSON.stringify(allStopsFixture))),
  );
});

afterAll(() => {
  process.cwd = realCwd;
  rmSync(fixtureRoot, { recursive: true, force: true });
  rmSync(emptyRoot, { recursive: true, force: true });
});

describe("loadAllBusStops", () => {
  it("decompresses and parses public/stops/all.json.gz", async () => {
    const stops = await withCwd(fixtureRoot, loadAllBusStops);

    expect(stops).toEqual(allStopsFixture);
  });

  it("returns an empty list and logs when the archive is missing", async () => {
    const error = spyOnConsoleError();

    const stops = await withCwd(emptyRoot, loadAllBusStops);

    expect(stops).toEqual([]);
    expect(error.calls[0]?.[0]).toBe("all.json.gz not found in public/stops");
    error.restore();
  });

  it("returns an empty list when the archive is not valid gzip", async () => {
    const brokenRoot = mkdtempSync(join(tmpdir(), "bus-map-broken-"));
    mkdirSync(join(brokenRoot, "public", "stops"), { recursive: true });
    writeFileSync(join(brokenRoot, "public", "stops", "all.json.gz"), "nope");
    const error = spyOnConsoleError();

    const stops = await withCwd(brokenRoot, loadAllBusStops);

    expect(stops).toEqual([]);
    expect(error.calls[0]?.[0]).toBe("Error loading all bus stops:");
    error.restore();
    rmSync(brokenRoot, { recursive: true, force: true });
  });
});

describe("loadBusStopsForLineIds", () => {
  function writeLineFixture(lineId: string, contents: unknown) {
    writeFileSync(
      join(stopsDir, `${lineId}.json`),
      typeof contents === "string" ? contents : JSON.stringify(contents),
    );
  }

  it("maps raw Moventis stops onto BusStop objects", async () => {
    writeLineFixture("10", [rawStop()]);

    const stops = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["10"]),
    );

    expect(stops).toEqual([
      {
        id: 100,
        name: "Plaça Major",
        lat: 41.49,
        lon: 2.14,
        buses: ["1"],
        lineId: 1,
        zoneId: 3,
      },
    ]);
  });

  it("defaults a missing zone to 0", async () => {
    writeLineFixture("11", [
      rawStop({
        Parada: { DESC_PARADA: "Sense zona", LATITUD: 1, LONGITUD: 2 },
      }),
    ]);

    const [stop] = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["11"]),
    );

    expect(stop?.zoneId).toBe(0);
  });

  it("skips stops missing an id, a name or numeric coordinates", async () => {
    writeLineFixture("12", [
      rawStop({ ID_PARADA: 0 }),
      rawStop({ ID_PARADA: 201, Parada: { LATITUD: 1, LONGITUD: 2 } }),
      rawStop({
        ID_PARADA: 202,
        Parada: { DESC_PARADA: "Sense lat", LATITUD: "1", LONGITUD: 2 },
      }),
      rawStop({
        ID_PARADA: 203,
        Parada: { DESC_PARADA: "Sense lon", LATITUD: 1, LONGITUD: null },
      }),
      null,
    ]);

    const stops = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["12"]),
    );

    expect(stops).toEqual([]);
  });

  it("merges the bus lines of a stop shared by several lines", async () => {
    writeLineFixture("20", [rawStop({ ID_LINEA: 20 })]);
    writeLineFixture("21", [rawStop({ ID_LINEA: 21 })]);

    const stops = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["20", "21"]),
    );

    expect(stops).toHaveLength(1);
    expect(stops[0]?.buses).toEqual(["20", "21"]);
    // The first line wins for the scalar fields
    expect(stops[0]?.lineId).toBe(20);
  });

  it("does not duplicate a line already listed on the stop", async () => {
    writeLineFixture("30", [
      rawStop({ ID_LINEA: 30 }),
      rawStop({ ID_LINEA: 30 }),
    ]);

    const stops = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["30", "30"]),
    );

    expect(stops[0]?.buses).toEqual(["30"]);
  });

  it("ignores line ids with no fixture file", async () => {
    const stops = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["does-not-exist"]),
    );

    expect(stops).toEqual([]);
  });

  it("keeps going when one line file is malformed", async () => {
    writeLineFixture("40", "{ not json");
    writeLineFixture("41", [rawStop({ ID_LINEA: 41, ID_PARADA: 410 })]);
    const error = spyOnConsoleError();

    const stops = await withCwd(fixtureRoot, () =>
      loadBusStopsForLineIds(["40", "41"]),
    );

    expect(stops.map((stop) => stop.id)).toEqual([410]);
    expect(error.calls[0]?.[0]).toBe("Error loading stops for line 40:");
    error.restore();
  });

  it("returns an empty list for an empty line id list", async () => {
    expect(
      await withCwd(fixtureRoot, () => loadBusStopsForLineIds([])),
    ).toEqual([]);
  });
});

function spyOnConsoleError() {
  const original = console.error;
  const calls: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };
  return {
    calls,
    restore: () => {
      console.error = original;
    },
  };
}
