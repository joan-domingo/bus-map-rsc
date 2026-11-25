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
import { getVisiblePriorityLineSlugs } from "../../lib/utils/seo";
import { createStopsFixture } from "../../test/stopsFixture";
import { metadata as rootMetadata } from "../layout";
import Home, { metadata } from "../page";

const stops: BusStop[] = [
  {
    id: 1,
    name: "Parada 1",
    lat: 41.5,
    lon: 2.1,
    buses: ["1"],
    lineId: 1,
    zoneId: 3,
  },
  {
    id: 2,
    name: "Parada 2",
    lat: 41.6,
    lon: 2.2,
    buses: ["68"],
    lineId: 68,
    zoneId: 3,
  },
];

const fixture = createStopsFixture(stops);
const TOKEN_ENV = "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN";
const originalToken = process.env[TOKEN_ENV];

afterAll(() => {
  fixture.cleanup();
});

describe("home page metadata", () => {
  it("uses the shared home page SEO copy", () => {
    expect(metadata.title).toEqual({
      absolute: "Moventis temps real i tiempo real | QuanTriga",
    });
    expect(metadata.description).toContain("Moventis en temps real");
  });

  // A plain string title would have the root layout's "%s | QuanTriga.com"
  // template applied to it, and this title already ends in the brand.
  it("opts out of the title template so the brand is not doubled", async () => {
    const { resolveTitle } = await import(
      "next/dist/lib/metadata/resolvers/resolve-title.js"
    );
    const template = (rootMetadata.title as { template: string }).template;

    expect(resolveTitle(metadata.title, template).absolute).toBe(
      "Moventis temps real i tiempo real | QuanTriga",
    );
    // What a bare string would have produced
    expect(
      resolveTitle("Moventis temps real i tiempo real | QuanTriga", template)
        .absolute,
    ).toBe("Moventis temps real i tiempo real | QuanTriga | QuanTriga.com");
  });
});

describe("Home", () => {
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

  async function renderHome() {
    return render(await fixture.use(() => Home()));
  }

  it("renders the map with the stops loaded from disk", async () => {
    await renderHome();

    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN/),
    ).toBeInTheDocument();
  });

  it("links the most searched lines", async () => {
    await renderHome();

    const nav = screen.getByRole("navigation", {
      name: "Línies de bus més buscades",
    });
    const slugs = getVisiblePriorityLineSlugs();
    const links = [...nav.querySelectorAll("a")];

    expect(
      links.slice(0, slugs.length).map((a) => a.getAttribute("href")),
    ).toEqual(slugs.map((slug) => `/linia/${slug}`));
    expect(links.slice(0, slugs.length).map((a) => a.textContent)).toEqual(
      slugs.map((slug) => slug.toUpperCase()),
    );
  });

  it("comma-separates the line links except the last one", async () => {
    await renderHome();

    const nav = screen.getByRole("navigation", {
      name: "Línies de bus més buscades",
    });
    const slugs = getVisiblePriorityLineSlugs();

    expect(nav.textContent).toContain(
      `${slugs.map((slug) => slug.toUpperCase()).join(", ")} · `,
    );
  });

  it("also links the full lines index", async () => {
    await renderHome();

    const nav = screen.getByRole("navigation", {
      name: "Línies de bus més buscades",
    });
    const indexLink = [...nav.querySelectorAll("a")].at(-1);

    expect(indexLink).toHaveTextContent("Totes les línies");
    expect(indexLink).toHaveAttribute("href", "/linies");
  });
});
