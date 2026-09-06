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
import { useMapStore } from "../../lib/store/useMapStore";
import { useStarredStops } from "../../lib/store/useStarredStops";
import type { BusStop } from "../../lib/types";
import { resetMapsMock } from "../../test/googleMapsMock";
import { NotFoundError, RedirectError } from "../../test/nextNavigationMock";
import { createStopsFixture } from "../../test/stopsFixture";
import LinePage, { dynamic, generateMetadata } from "../linea/[line]/page";

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

const API_KEY_ENV = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";
const originalApiKey = process.env[API_KEY_ENV];

function params(line: string) {
  return { params: Promise.resolve({ line }) };
}

afterAll(() => {
  fixture.cleanup();
});

describe("/linea/[line] route config", () => {
  it("renders per request so timetables are never cached", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});

describe("generateMetadata", () => {
  it("builds canonical, OpenGraph and Twitter metadata for a known line", async () => {
    const metadata = await generateMetadata(params("n80"));

    expect(metadata.title).toBe("Bus N80 temps real i tiempo real · Moventis");
    expect(metadata.alternates?.canonical).toBe("/linea/n80");
    expect(metadata.openGraph).toMatchObject({
      url: "/linea/n80",
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
    expect(metadata.alternates?.canonical).toBe("/linea/c30");
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
    resetMapsMock();
    process.env[API_KEY_ENV] = "test-api-key";
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
    if (originalApiKey === undefined) {
      delete process.env[API_KEY_ENV];
    } else {
      process.env[API_KEY_ENV] = originalApiKey;
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

  it("404s on an internal numeric id", async () => {
    await expect(renderPage("14")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("redirects a non-canonical slug to the canonical one", async () => {
    await expect(renderPage("C-30")).rejects.toMatchObject({
      url: "/linea/c30",
    });
    await expect(renderPage("C-30")).rejects.toBeInstanceOf(RedirectError);
  });

  it("accepts an already-canonical uppercase slug without redirecting", async () => {
    await renderPage("N80");

    expect(screen.getByTestId("google-map")).toBeInTheDocument();
  });

  it("emits the line's structured data", async () => {
    const { container } = await renderPage("n80");

    const jsonLd = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')
        ?.innerHTML ?? "null",
    );
    expect(jsonLd.name).toBe("Bus N80 Moventis en temps real");
    expect(jsonLd.url).toBe("https://quantriga.com/linea/n80");
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

  it("merges the line's own stops into the full stop list", async () => {
    await renderPage("n80");

    // Stops 1 and 3 are on the line, so both are shown, plus the user marker
    expect(screen.getAllByTestId("advanced-marker")).toHaveLength(3);
    // Both stop markers carry the N80 badge
    expect(screen.getAllByText("N80")).toHaveLength(2);
  });

  it("adds the line to a stop already present in the global list", async () => {
    const { container } = await renderPage("n80");

    // Stop 1 arrives from all.json.gz with only line "1" and gains line "68"
    const badges = [
      ...container.querySelectorAll("[data-testid='advanced-marker']"),
    ]
      .map((marker) => marker.textContent)
      .filter(Boolean);
    expect(
      badges.some((label) => label?.includes("C1") && label?.includes("N80")),
    ).toBe(true);
  });
});
