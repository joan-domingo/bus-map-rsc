import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FakeMap, mapsMock, resetMapsMock } from "../../../test/googleMapsMock";
import { useMapStore } from "../../store/useMapStore";
import { useStarredStops } from "../../store/useStarredStops";
import type { BusStop } from "../../types";
import { BusStopCustomMarkers } from "../BusStopCustomMarker";

function makeStop(id: number, lat: number, lon: number): BusStop {
  return {
    id,
    name: `Parada ${id}`,
    lat,
    lon,
    buses: ["1"],
    lineId: 1,
    zoneId: 3,
  };
}

/** A lat/lng grid of `size` x `size` stops spread across the given bounds. */
function makeGrid(size: number, south = 41, west = 2, span = 1): BusStop[] {
  const stops: BusStop[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      stops.push(
        makeStop(
          row * size + col + 1,
          south + (span * (row + 0.5)) / size,
          west + (span * (col + 0.5)) / size,
        ),
      );
    }
  }
  return stops;
}

const VIEWPORT = { south: 41, west: 2, north: 42, east: 3 };

/**
 * Below zoom 14 the component never backfills stops from outside the viewport,
 * so this is the zoom to use when asserting on viewport filtering alone.
 */
const ZOOM_WITHOUT_BACKFILL = 13;

function renderMarkers(
  stops: BusStop[],
  overrides: { selectedStopId?: number | null } = {},
) {
  const onStopClick = mock();
  const onCloseClick = mock();
  const result = render(
    <BusStopCustomMarkers
      stops={stops}
      selectedStopId={overrides.selectedStopId ?? null}
      onStopClick={onStopClick}
      onCloseClick={onCloseClick}
    />,
  );
  return { ...result, onStopClick, onCloseClick };
}

describe("BusStopCustomMarkers", () => {
  beforeEach(() => {
    resetMapsMock();
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
    localStorage.clear();
  });

  describe("without a map instance", () => {
    it("renders every stop with finite coordinates", () => {
      renderMarkers([makeStop(1, 41.5, 2.1), makeStop(2, 41.6, 2.2)]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
    });

    it("coerces string coordinates to numbers", () => {
      renderMarkers([
        {
          ...makeStop(1, 0, 0),
          lat: "41.5" as unknown as number,
          lon: "2.1" as unknown as number,
        },
      ]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);
    });

    it("drops stops whose coordinates are not finite numbers", () => {
      renderMarkers([
        makeStop(1, 41.5, 2.1),
        { ...makeStop(2, 0, 0), lat: Number.NaN },
        { ...makeStop(3, 0, 0), lon: "not a number" as unknown as number },
        { ...makeStop(4, 0, 0), lat: Number.POSITIVE_INFINITY },
      ]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);
    });
  });

  describe("with a map instance", () => {
    it("falls back to every stop while the map has no bounds yet", () => {
      mapsMock.map = new FakeMap(undefined);

      renderMarkers([makeStop(1, 41.5, 2.1), makeStop(2, 80, 80)]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
    });

    it("hides stops far outside the viewport", () => {
      mapsMock.map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);

      renderMarkers([
        makeStop(1, 41.5, 2.5),
        // 20 degrees away, well beyond the 20% bounds expansion
        makeStop(2, 61.5, 22.5),
      ]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);
    });

    it("keeps stops just outside the viewport, thanks to the 20% expansion", () => {
      mapsMock.map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);

      renderMarkers([makeStop(1, 41.5, 2.5), makeStop(2, 42.1, 3.1)]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
    });

    it("caps the number of markers at 200", () => {
      mapsMock.map = new FakeMap(VIEWPORT, 12);

      renderMarkers(makeGrid(30));

      expect(
        screen.getAllByTestId("advanced-marker").length,
      ).toBeLessThanOrEqual(200);
    });

    it("spreads the markers across the viewport instead of clustering them", () => {
      mapsMock.map = new FakeMap(VIEWPORT, 12);
      // 400 stops packed into the south-west corner plus one in the north-east
      const dense = makeGrid(20, 41, 2, 0.2);
      const outlier = makeStop(9999, 41.9, 2.9);

      renderMarkers([...dense, outlier]);

      const markers = screen.getAllByTestId("advanced-marker");
      expect(markers.length).toBeLessThanOrEqual(200);
      // The lone far-away stop survives because it owns its own grid cell
      expect(markers.length).toBeGreaterThan(0);
    });

    it("always renders the selected stop, even when it left the viewport", () => {
      mapsMock.map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);
      // A full viewport of stops, so the grid has no room to spare...
      const dense = makeGrid(20);
      // ...and a selected stop that the viewport filter would otherwise drop
      const selected = makeStop(7777, 61.5, 22.5);

      renderMarkers([...dense, selected], { selectedStopId: 7777 });

      // Its open info window proves the selected stop was rendered
      expect(screen.getByTestId("info-window")).toBeInTheDocument();
      expect(
        screen.getAllByTestId("advanced-marker").length,
      ).toBeLessThanOrEqual(200);
    });

    it("backfills nearby stops when the viewport is nearly empty at zoom >= 14", () => {
      mapsMock.map = new FakeMap(VIEWPORT, 15);
      // Only 3 stops inside the viewport, the rest just outside it
      const inside = [
        makeStop(1, 41.5, 2.5),
        makeStop(2, 41.6, 2.6),
        makeStop(3, 41.4, 2.4),
      ];
      const nearby = Array.from({ length: 30 }, (_, index) =>
        makeStop(100 + index, 42.05 + index * 0.001, 3.05 + index * 0.001),
      );

      renderMarkers([...inside, ...nearby]);

      // The fallback pulls in stops from outside the strict viewport
      expect(screen.getAllByTestId("advanced-marker").length).toBeGreaterThan(
        inside.length,
      );
    });

    it("does not backfill when zoomed out past 14", () => {
      mapsMock.map = new FakeMap(VIEWPORT, 13);
      const inside = [makeStop(1, 41.5, 2.5)];
      const faraway = Array.from({ length: 30 }, (_, index) =>
        makeStop(100 + index, 50 + index, 20 + index),
      );

      renderMarkers([...inside, ...faraway]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);
    });

    it("recomputes the visible stops when the map bounds change", async () => {
      const map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);
      mapsMock.map = map;
      renderMarkers([makeStop(1, 41.5, 2.5), makeStop(2, 51.5, 12.5)]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);

      act(() => {
        map.setBounds({ south: 41, west: 2, north: 52, east: 13 });
        map.emit("bounds_changed");
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
      });
    });

    it("recomputes the visible stops when the zoom changes", async () => {
      const map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);
      mapsMock.map = map;
      renderMarkers([makeStop(1, 41.5, 2.5), makeStop(2, 51.5, 12.5)]);

      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);

      act(() => {
        map.setBounds({ south: 41, west: 2, north: 52, east: 13 });
        map.zoom = 10;
        map.emit("zoom_changed");
      });

      await waitFor(() => {
        expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
      });
    });

    it("debounces bursts of map events into a single recompute", async () => {
      const map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);
      mapsMock.map = map;
      renderMarkers([makeStop(1, 41.5, 2.5), makeStop(2, 51.5, 12.5)]);

      act(() => {
        map.setBounds({ south: 41, west: 2, north: 52, east: 13 });
        map.emit("bounds_changed");
        map.emit("bounds_changed");
        map.emit("zoom_changed");
      });

      // Still showing the pre-event result until the debounce elapses
      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(1);
      await waitFor(() => {
        expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
      });
    });

    it("removes its map listeners on unmount", () => {
      const map = new FakeMap(VIEWPORT, ZOOM_WITHOUT_BACKFILL);
      mapsMock.map = map;
      const { unmount } = renderMarkers([makeStop(1, 41.5, 2.5)]);

      expect(map.listenerCount()).toBe(2);

      unmount();

      expect(map.listenerCount()).toBe(0);
    });

    it("treats a zoom of 0 as the default of 15", () => {
      mapsMock.map = new FakeMap(VIEWPORT, 0);

      renderMarkers([makeStop(1, 41.5, 2.5), makeStop(2, 51.5, 12.5)]);

      // Falling back to 15 keeps the >= 14 backfill branch active, so the
      // far-away stop is pulled in; at zoom 13 it would have been dropped.
      expect(screen.getAllByTestId("advanced-marker")).toHaveLength(2);
    });
  });

  it("forwards marker clicks with the clicked stop", async () => {
    const stop = makeStop(1, 41.5, 2.1);
    const { onStopClick } = renderMarkers([stop]);

    await userEvent.click(screen.getByTestId("advanced-marker"));

    expect(onStopClick).toHaveBeenCalledTimes(1);
    expect(onStopClick.mock.calls[0]?.[0]).toMatchObject({ id: 1 });
  });

  it("forwards the info window close request", async () => {
    const { onCloseClick } = renderMarkers([makeStop(1, 41.5, 2.1)], {
      selectedStopId: 1,
    });

    await userEvent.click(screen.getByRole("button", { name: "Tanca" }));

    expect(onCloseClick).toHaveBeenCalledTimes(1);
  });

  it("opens the info window only for the selected stop", () => {
    renderMarkers([makeStop(1, 41.5, 2.1), makeStop(2, 41.6, 2.2)], {
      selectedStopId: 2,
    });

    expect(screen.getAllByTestId("info-window")).toHaveLength(1);
  });
});
