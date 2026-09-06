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
import { resetMapsMock } from "../../test/googleMapsMock";
import { createStopsFixture } from "../../test/stopsFixture";
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
const API_KEY_ENV = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";
const originalApiKey = process.env[API_KEY_ENV];

afterAll(() => {
  fixture.cleanup();
});

describe("home page metadata", () => {
  it("uses the shared home page SEO copy", () => {
    expect(metadata.title).toBe(
      "Moventis temps real i tiempo real | QuanTriga",
    );
    expect(metadata.description).toContain("Moventis en temps real");
  });
});

describe("Home", () => {
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

  async function renderHome() {
    return render(await fixture.use(() => Home()));
  }

  it("renders the map with the stops loaded from disk", async () => {
    await renderHome();

    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    // Two stop markers plus the user location marker
    expect(screen.getAllByTestId("advanced-marker")).toHaveLength(3);
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
    ).toEqual(slugs.map((slug) => `/linea/${slug}`));
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
