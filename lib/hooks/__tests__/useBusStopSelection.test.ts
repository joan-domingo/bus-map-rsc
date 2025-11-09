import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { useMapStore } from "../../store/useMapStore";
import type { BusStop } from "../../types";
import { useBusStopSelection } from "../useBusStopSelection";

describe("useBusStopSelection", () => {
  beforeEach(() => {
    // Reset store state before each test
    useMapStore.getState().clearSelectedBusStopTimetable();
  });

  afterEach(() => {
    // Reset store state after each test
    useMapStore.getState().clearSelectedBusStopTimetable();
  });

  it("should initialize with no selected stop", () => {
    const { result } = renderHook(() => useBusStopSelection());

    expect(result.current.selectedStopId).toBeNull();
  });

  it("should select a stop and load timetable", async () => {
    const mockStop: BusStop = {
      id: 123,
      name: "Test Stop",
      lat: 41.5,
      lon: 2.15,
      buses: ["1", "2"],
      lineId: 1,
      zoneId: 1,
    };

    // Mock fetch for the API call
    global.fetch = mock(() =>
      Promise.resolve({
        json: async () => [
          {
            idLinea: 1,
            desc_linea: "Test Line",
            trayectos: {
              Destination: [{ minutos: "5.0", real: "S" }],
            },
          },
        ],
      }),
    );

    const { result } = renderHook(() => useBusStopSelection());

    await result.current.selectStop(mockStop);

    await waitFor(() => {
      expect(result.current.selectedStopId).toBe(123);
    });
  });

  it("should clear previous selection when selecting a new stop", async () => {
    const mockStop1: BusStop = {
      id: 123,
      name: "Stop 1",
      lat: 41.5,
      lon: 2.15,
      buses: ["1"],
      lineId: 1,
      zoneId: 1,
    };

    const mockStop2: BusStop = {
      id: 456,
      name: "Stop 2",
      lat: 41.6,
      lon: 2.16,
      buses: ["2"],
      lineId: 2,
      zoneId: 2,
    };

    global.fetch = mock(() =>
      Promise.resolve({
        json: async () => [
          {
            idLinea: 1,
            desc_linea: "Test Line",
            trayectos: {
              Destination: [{ minutos: "5.0", real: "S" }],
            },
          },
        ],
      }),
    );

    const { result } = renderHook(() => useBusStopSelection());

    await result.current.selectStop(mockStop1);
    await waitFor(() => {
      expect(result.current.selectedStopId).toBe(123);
    });

    await result.current.selectStop(mockStop2);
    await waitFor(() => {
      expect(result.current.selectedStopId).toBe(456);
    });
  });

  it("should clear selection", async () => {
    const mockStop: BusStop = {
      id: 123,
      name: "Test Stop",
      lat: 41.5,
      lon: 2.15,
      buses: ["1"],
      lineId: 1,
      zoneId: 1,
    };

    global.fetch = mock(() =>
      Promise.resolve({
        json: async () => [
          {
            idLinea: 1,
            desc_linea: "Test Line",
            trayectos: {
              Destination: [{ minutos: "5.0", real: "S" }],
            },
          },
        ],
      }),
    );

    const { result } = renderHook(() => useBusStopSelection());

    // Select a stop first
    await result.current.selectStop(mockStop);
    await waitFor(() => {
      expect(result.current.selectedStopId).toBe(123);
    });

    // Clear selection
    result.current.clearSelection();

    await waitFor(() => {
      expect(result.current.selectedStopId).toBeNull();
    });
  });

  it("should handle multiple rapid selections", async () => {
    const mockStop1: BusStop = {
      id: 123,
      name: "Stop 1",
      lat: 41.5,
      lon: 2.15,
      buses: ["1"],
      lineId: 1,
      zoneId: 1,
    };

    const mockStop2: BusStop = {
      id: 456,
      name: "Stop 2",
      lat: 41.6,
      lon: 2.16,
      buses: ["2"],
      lineId: 2,
      zoneId: 2,
    };

    global.fetch = mock(() =>
      Promise.resolve({
        json: async () => [
          {
            idLinea: 1,
            desc_linea: "Test Line",
            trayectos: {
              Destination: [{ minutos: "5.0", real: "S" }],
            },
          },
        ],
      }),
    );

    const { result } = renderHook(() => useBusStopSelection());

    // Select first stop
    const promise1 = result.current.selectStop(mockStop1);
    // Immediately select second stop
    const promise2 = result.current.selectStop(mockStop2);

    await Promise.all([promise1, promise2]);

    await waitFor(() => {
      // Should end up with the last selected stop
      expect(result.current.selectedStopId).toBe(456);
    });
  });
});
