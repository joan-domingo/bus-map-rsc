import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FakeMap, mapsMock, resetMapsMock } from "../../../test/googleMapsMock";
import { useMapStore } from "../../store/useMapStore";
import { useStarredStops } from "../../store/useStarredStops";
import type { BusStop } from "../../types";
import { BusMap } from "../Map";

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
];

function renderMap(overrides: Partial<Parameters<typeof BusMap>[0]> = {}) {
  const setIsDragging = mock();
  const setZoom = mock();
  const onStopSelectionChange = mock();
  const props = {
    busStops,
    userLocation: { lat: 41.49, lng: 2.14 },
    isDragging: false,
    zoom: 15,
    setIsDragging,
    setZoom,
    onStopSelectionChange,
    ...overrides,
  };
  return {
    ...render(<BusMap {...props} />),
    setIsDragging,
    setZoom,
    onStopSelectionChange,
  };
}

function mapProps() {
  return mapsMock.props.Map as Record<string, unknown>;
}

describe("BusMap", () => {
  beforeEach(() => {
    resetMapsMock();
    mapsMock.map = new FakeMap({ south: 40, west: 1, north: 43, east: 4 });
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
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("configures the map for a full-bleed, gesture-friendly view", () => {
    renderMap();

    expect(mapProps()).toMatchObject({
      defaultZoom: 15,
      zoom: 15,
      gestureHandling: "greedy",
      disableDefaultUI: true,
      mapId: "public-transport-map",
      style: { width: "100%", height: "100%" },
    });
  });

  it("follows the user location while the map is not being dragged", () => {
    renderMap({ isDragging: false });

    expect(mapProps().center).toEqual({ lat: 41.49, lng: 2.14 });
    expect(mapProps().defaultCenter).toEqual({ lat: 41.49, lng: 2.14 });
  });

  it("stops recentering once the user drags the map", () => {
    renderMap({ isDragging: true });

    expect(mapProps().center).toBeUndefined();
    // The initial center still comes from the user location
    expect(mapProps().defaultCenter).toEqual({ lat: 41.49, lng: 2.14 });
  });

  it("reports the new zoom level upwards", () => {
    const { setZoom } = renderMap();

    act(() => {
      (mapProps().onZoomChanged as (event: unknown) => void)({
        detail: { zoom: 18 },
      });
    });

    expect(setZoom).toHaveBeenCalledWith(18);
  });

  it("flags dragging as soon as a drag starts", () => {
    const { setIsDragging } = renderMap();

    act(() => {
      (mapProps().onDragstart as () => void)();
    });

    expect(setIsDragging).toHaveBeenCalledWith(true);
  });

  it("renders the user location marker on top of the stop markers", () => {
    renderMap();

    // One marker for the bus stop, one for the user location
    expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
  });

  it("omits the user location marker when the location is unknown", () => {
    renderMap({ userLocation: undefined });

    expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);
  });

  it("opens the stop panel for a clicked stop and loads its timetable", async () => {
    const fetchMock = mock(async () => new Response("[]"));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const { onStopSelectionChange } = renderMap();

    await userEvent.click(
      screen.getAllByTestId("advanced-marker")[0] as HTMLElement,
    );

    expect(
      screen.getByRole("heading", { name: "Parada 1" }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onStopSelectionChange).toHaveBeenCalledWith(true);
    globalThis.fetch = originalFetch;
  });

  it("closes the stop panel again from its close button", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response("[]"),
    ) as unknown as typeof fetch;
    const { onStopSelectionChange } = renderMap();

    await userEvent.click(
      screen.getAllByTestId("advanced-marker")[0] as HTMLElement,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Tanca els horaris de la parada" }),
    );

    expect(screen.queryByRole("heading", { name: "Parada 1" })).toBeNull();
    expect(onStopSelectionChange).toHaveBeenLastCalledWith(false);
    globalThis.fetch = originalFetch;
  });
});
