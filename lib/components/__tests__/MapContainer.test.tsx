import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mapsMock, resetMapsMock } from "../../../test/googleMapsMock";
import { useMapStore } from "../../store/useMapStore";
import { useStarredStops } from "../../store/useStarredStops";
import type { BusStop } from "../../types";
import { MapContainer } from "../MapContainer";

function makeStop(id: number, buses: string[]): BusStop {
  return {
    id,
    name: `Parada ${id}`,
    lat: 41.5 + id / 1000,
    lon: 2.1 + id / 1000,
    buses,
    lineId: Number(buses[0]),
    zoneId: 3,
  };
}

const allBusStops = [
  makeStop(1, ["1"]),
  makeStop(2, ["68"]),
  makeStop(3, ["1", "68"]),
];

const API_KEY_ENV = "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY";
const originalApiKey = process.env[API_KEY_ENV];

function markerCount() {
  // The user location marker is always rendered on top of the stop markers
  return screen.getAllByTestId("advanced-marker").length - 1;
}

describe("MapContainer", () => {
  beforeEach(() => {
    resetMapsMock();
    // happy-dom ships no geolocation, so stand in a silent one
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {
        getCurrentPosition: mock(),
        watchPosition: mock(() => 1),
        clearWatch: mock(),
      },
    });
    process.env[API_KEY_ENV] = "test-api-key";
    useStarredStops.setState({
      starredStopIdsArray: [],
      showOnlyStarred: false,
    });
    useMapStore.setState({
      selectedStopTimetable: [],
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: false,
    });
    window.gtag = undefined;
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env[API_KEY_ENV];
    } else {
      process.env[API_KEY_ENV] = originalApiKey;
    }
    window.gtag = undefined;
    localStorage.clear();
  });

  it("renders the header, map, location button and attribution", () => {
    render(<MapContainer allBusStops={allBusStops} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Get location" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Moventis" })).toBeInTheDocument();
  });

  it("passes the API key and Catalan locale to the Maps provider", () => {
    render(<MapContainer allBusStops={allBusStops} />);

    expect(mapsMock.props.APIProvider).toMatchObject({
      apiKey: "test-api-key",
      language: "ca",
    });
  });

  it("explains what to do when the API key is missing", () => {
    delete process.env[API_KEY_ENV];

    render(<MapContainer allBusStops={allBusStops} />);

    expect(
      screen.getByRole("heading", { name: "Google Maps API Key Required" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("google-map")).toBeNull();
  });

  it("shows every stop when there is no filter", () => {
    render(<MapContainer allBusStops={allBusStops} />);

    expect(markerCount()).toBe(3);
  });

  it("keeps only the stops served by the highlighted line", () => {
    render(
      <MapContainer
        allBusStops={allBusStops}
        lineFilter={{ lineStopIds: ["68"], lineName: "N80" }}
      />,
    );

    // Stops 2 and 3 are served by line "68"
    expect(markerCount()).toBe(2);
  });

  it("puts the highlighted line name in the header", () => {
    render(
      <MapContainer
        allBusStops={allBusStops}
        lineFilter={{ lineStopIds: ["68"], lineName: "N80" }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "QuanTriga.com | Bus N80 temps real · Moventis",
      }),
    ).toBeInTheDocument();
  });

  it("keeps only starred stops once the star filter is on", () => {
    useStarredStops.setState({
      starredStopIdsArray: [3],
      showOnlyStarred: true,
    });

    render(<MapContainer allBusStops={allBusStops} />);

    expect(markerCount()).toBe(1);
  });

  it("combines the line filter with the star filter", () => {
    useStarredStops.setState({
      starredStopIdsArray: [1, 3],
      showOnlyStarred: true,
    });

    render(
      <MapContainer
        allBusStops={allBusStops}
        lineFilter={{ lineStopIds: ["68"], lineName: "N80" }}
      />,
    );

    // Only stop 3 is both starred and on line "68"
    expect(markerCount()).toBe(1);
  });

  it("toggles the star filter from the header and reports the event", async () => {
    const gtag = mock();
    window.gtag = gtag;
    useStarredStops.setState({ starredStopIdsArray: [3] });
    render(<MapContainer allBusStops={allBusStops} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar només parades preferides" }),
    );

    expect(useStarredStops.getState().showOnlyStarred).toBe(true);
    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "toggle_starred_filter",
      { show_only_starred: true, starred_stops_count: 1 },
    ]);
    expect(markerCount()).toBe(1);
  });

  it("turns the star filter back off", async () => {
    useStarredStops.setState({
      starredStopIdsArray: [3],
      showOnlyStarred: true,
    });
    render(<MapContainer allBusStops={allBusStops} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar totes les parades" }),
    );

    expect(useStarredStops.getState().showOnlyStarred).toBe(false);
    expect(markerCount()).toBe(3);
  });

  it("recenters on the user and zooms in from the location button", async () => {
    const gtag = mock();
    window.gtag = gtag;
    render(<MapContainer allBusStops={allBusStops} />);

    await userEvent.click(screen.getByRole("button", { name: "Get location" }));

    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "location_button_click",
      { current_zoom: 15 },
    ]);
    expect(mapsMock.props.Map).toMatchObject({ zoom: 18 });
    expect(mapsMock.props.Map.center).toBeDefined();
  });

  it("warns but still renders the map when geolocation fails", () => {
    const originalWarn = console.warn;
    const warnings: unknown[][] = [];
    console.warn = (...args: unknown[]) => warnings.push(args);
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: undefined,
    });

    render(<MapContainer allBusStops={allBusStops} />);

    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    expect(warnings).toContainEqual([
      "Geolocation error:",
      "Geolocation is not supported by this browser",
    ]);

    console.warn = originalWarn;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: originalGeolocation,
    });
  });
});
