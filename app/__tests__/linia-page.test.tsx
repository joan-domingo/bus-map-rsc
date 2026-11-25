import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
} from "bun:test";
import { render, screen } from "@testing-library/react";
import { STOPS_SHEET_PEEK } from "../../lib/components/lineStopsSheet";
import { useMapStore } from "../../lib/store/useMapStore";
import { useStarredStops } from "../../lib/store/useStarredStops";
import type { BusStop } from "../../lib/types";
import { NotFoundError, RedirectError } from "../../test/nextNavigationMock";
import { createStopsFixture } from "../../test/stopsFixture";
import LegacyLinePage from "../linea/[line]/page";
import LinePage, { dynamic, generateMetadata } from "../linia/[line]/page";

/** "68" is the internal id behind the n80 Search Console alias. */
const N80_LINE_ID = "68";

const allStops: BusStop[] = [
  {
    id: 1,
    name: "Parada compartida",
    lat: 41.5,
    lon: 2.1,
    buses: ["1"],
    lineId: 1,
    zoneId: 3,
  },
  {
    id: 2,
    name: "Parada d'una altra línia",
    lat: 41.6,
    lon: 2.2,
    buses: ["99"],
    lineId: 99,
    zoneId: 3,
  },
];

function rawStop(id: number, name: string) {
  return {
    ID_LINEA: Number(N80_LINE_ID),
    ID_PARADA: id,
    Parada: {
      DESC_PARADA: name,
      LATITUD: 41.7,
      LONGITUD: 2.3,
      ID_ZONA: 4,
    },
  };
}

const fixture = createStopsFixture(allStops, {
  // Stop 1 is already in all.json.gz; stop 3 is new to it
  [N80_LINE_ID]: [rawStop(1, "Parada compartida"), rawStop(3, "Parada N80")],
});

const TOKEN_ENV = "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN";
const originalToken = process.env[TOKEN_ENV];

function params(line: string) {
  return { params: Promise.resolve({ line }) };
}

afterAll(() => {
  fixture.cleanup();
});

describe("/linia/[line] route config", () => {
  it("renders per request so timetables are never cached", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});

describe("generateMetadata", () => {
  it("builds canonical, OpenGraph and Twitter metadata for a known line", async () => {
    const metadata = await generateMetadata(params("n80"));

    expect(metadata.title).toBe("Bus N80 temps real i tiempo real · Moventis");
    expect(metadata.alternates?.canonical).toBe("/linia/n80");
    expect(metadata.openGraph).toMatchObject({
      url: "/linia/n80",
      type: "website",
      images: [
        {
          url: "/og-image/n80",
          width: 1200,
          height: 630,
          alt: "Bus N80 Moventis en temps real · QuanTriga.com",
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og-image/n80"],
    });
  });

  it("canonicalises an alternate spelling to the canonical slug", async () => {
    const metadata = await generateMetadata(params("C-30"));

    expect(metadata.title).toBe("Bus C30 temps real i tiempo real · Moventis");
    expect(metadata.alternates?.canonical).toBe("/linia/c30");
  });

  it("marks unknown lines noindex instead of describing them", async () => {
    const metadata = await generateMetadata(params("not-a-line"));

    expect(metadata.title).toBe("Línia no trobada");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toBeUndefined();
  });
});

describe("LinePage", () => {
  beforeEach(() => {
    process.env[TOKEN_ENV] = "";
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {
        getCurrentPosition: mock(),
        watchPosition: mock(() => 1),
        clearWatch: mock(),
      },
    });
    useStarredStops.setState({
      starredStopIdsArray: [],
      showOnlyStarred: false,
    });
    useMapStore.setState({
      selectedStopTimetable: [],
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: false,
    });
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env[TOKEN_ENV];
    } else {
      process.env[TOKEN_ENV] = originalToken;
    }
    localStorage.clear();
  });

  function renderPage(line: string) {
    return fixture.use(() => LinePage(params(line))).then(render);
  }

  it("404s on an unknown line", async () => {
    await expect(renderPage("not-a-line")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("404s on a busLineData key that no line is named after", async () => {
    // "444" keys "Línia V4.1", which lives at /linia/liniav4.1
    await expect(renderPage("444")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("redirects a non-canonical slug to the canonical one", async () => {
    await expect(renderPage("C-30")).rejects.toMatchObject({
      url: "/linia/c30",
    });
    await expect(renderPage("C-30")).rejects.toBeInstanceOf(RedirectError);
  });

  it("accepts an already-canonical uppercase slug without redirecting", async () => {
    await renderPage("N80");

    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
  });

  it("emits the line's structured data", async () => {
    const { container } = await renderPage("n80");

    const jsonLd = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.innerHTML ?? "null",
    );
    expect(jsonLd.name).toBe("Bus N80 Moventis en temps real");
    expect(jsonLd.url).toBe("https://quantriga.com/linia/n80");
  });

  describe("legacy /linea/[line] route", () => {
    it("permanently redirects a known line to the Catalan route", async () => {
      await expect(LegacyLinePage(params("e1"))).rejects.toMatchObject({
        url: "/linia/e1",
      });
      await expect(LegacyLinePage(params("e1"))).rejects.toBeInstanceOf(
        RedirectError,
      );
    });

    it("404s for unknown lines", async () => {
      await expect(LegacyLinePage(params("not-a-line"))).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });

  it("links back to the full map", async () => {
    await renderPage("n80");

    const nav = screen.getByRole("navigation", {
      name: "Navegació línies de bus",
    });
    expect(nav.querySelector("a")).toHaveAttribute("href", "/");
  });

  it("shows the line name in the header", async () => {
    await renderPage("n80");

    expect(
      screen.getByRole("heading", {
        name: "QuanTriga.com | Bus N80 temps real · Moventis",
      }),
    ).toBeInTheDocument();
  });

  // The sheet docks over the foot of the screen, so the map has to stop where
  // its header starts or the Moventis attribution ends up underneath it.
  it("ends the map exactly where the stop sheet docks", async () => {
    await renderPage("n80");

    const mapArea = screen
      .getByRole("region", { name: "Mapa interactiu de Mapbox" })
      .closest("[style]");
    expect(mapArea?.getAttribute("style")).toContain(
      `calc(100dvh - ${STOPS_SHEET_PEEK})`,
    );
  });

  it("lists the line's stops in the docked sheet, without opening it", async () => {
    await renderPage("n80");

    const sheetHeader = screen.getByRole("button", {
      name: /Parades de la línia N80/,
    });
    expect(sheetHeader).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Parada compartida", "Parada N80"]);
  });

  it("lists only the stops of this line, not every stop on the map", async () => {
    await renderPage("n80");

    // "Parada d'una altra línia" is in all.json.gz but not on line 68
    expect(
      screen.queryByText("Parada d'una altra línia"),
    ).not.toBeInTheDocument();
  });

  it("omits the stop sheet for a line with no stop file", async () => {
    // "c1" resolves, but the fixture ships no stop file for its line id
    await renderPage("c1");

    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /Parades de la línia/ }),
    ).toBeNull();
  });

  it("merges the line's own stops into the full stop list", async () => {
    await renderPage("n80");

    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Parada compartida", "Parada N80"]);
  });

  it("adds the line to a stop already present in the global list", async () => {
    await renderPage("n80");

    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
  });
});
