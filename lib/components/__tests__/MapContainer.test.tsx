import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMapStore } from "../../store/useMapStore";
import { useStarredStops } from "../../store/useStarredStops";
import type { BusStop } from "../../types";
import { MapContainer } from "../MapContainer";

const busStops: BusStop[] = [
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

const TOKEN_ENV = "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN";
const originalToken = process.env[TOKEN_ENV];

describe("MapContainer", () => {
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
      selectedStopTimetable: null,
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: false,
      selectedStopTimetableError: null,
      selectedStopTimetableUpdatedAt: null,
    });
    window.gtag = undefined;
  });

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env[TOKEN_ENV];
    } else {
      process.env[TOKEN_ENV] = originalToken;
    }
    window.gtag = undefined;
    localStorage.clear();
  });

  it("renders the header, Mapbox token guidance, location button and attribution", () => {
    render(<MapContainer allBusStops={busStops} />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Get location" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Moventis" })).toBeInTheDocument();
  });

  it("fills the viewport by default", () => {
    const { container } = render(<MapContainer allBusStops={busStops} />);

    expect(container.firstElementChild).toHaveStyle({ height: "100dvh" });
  });

  it("shrinks the map to make room for page content", () => {
    const { container } = render(
      <MapContainer allBusStops={busStops} mapHeight="calc(100dvh - 4rem)" />,
    );

    expect(container.firstElementChild?.getAttribute("style")).toContain(
      "calc(100dvh - 4rem)",
    );
  });

  it("puts the highlighted line name in the header", () => {
    render(
      <MapContainer
        allBusStops={busStops}
        lineFilter={{ lineStopIds: ["68"], lineName: "N80" }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "QuanTriga.com | Bus N80 temps real · Moventis",
      }),
    ).toBeInTheDocument();
  });

  it("toggles the starred-stop filter and tracks the event", async () => {
    const gtag = mock();
    window.gtag = gtag;
    useStarredStops.setState({ starredStopIdsArray: [2] });
    render(<MapContainer allBusStops={busStops} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar només parades preferides" }),
    );

    expect(useStarredStops.getState().showOnlyStarred).toBe(true);
    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "toggle_starred_filter",
      { show_only_starred: true, starred_stops_count: 1 },
    ]);
  });

  it("turns the starred-stop filter back off", async () => {
    useStarredStops.setState({
      starredStopIdsArray: [2],
      showOnlyStarred: true,
    });
    render(<MapContainer allBusStops={busStops} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar totes les parades" }),
    );

    expect(useStarredStops.getState().showOnlyStarred).toBe(false);
  });

  it("tracks a location-button click", async () => {
    const gtag = mock();
    window.gtag = gtag;
    render(<MapContainer allBusStops={busStops} />);

    await userEvent.click(screen.getByRole("button", { name: "Get location" }));

    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "location_button_click",
      { current_zoom: 15 },
    ]);
  });
});
