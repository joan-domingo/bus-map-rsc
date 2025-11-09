import { describe, it, expect, beforeEach, mock } from "bun:test";
import { useMapStore } from "../useMapStore";
import type { BusLineStopTimetable } from "../../types";

describe("useMapStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useMapStore.getState().clearSelectedBusStopTimetable();
    useMapStore.getState().setSelectedStopTimetableIsLoading(false);
    useMapStore.getState().setSelectedStopTimetableIsLoaded(false);
  });

  describe("clearSelectedBusStopTimetable", () => {
    it("should clear the selected stop timetable", () => {
      const store = useMapStore.getState();
      store.clearSelectedBusStopTimetable();

      expect(store.selectedStopTimetable).toEqual([]);
    });
  });

  describe("setSelectedStopTimetableIsLoading", () => {
    it("should set loading state", () => {
      const store = useMapStore.getState();
      store.setSelectedStopTimetableIsLoading(true);

      const updatedState = useMapStore.getState();
      expect(updatedState.selectedStopTimetableIsLoading).toBe(true);

      store.setSelectedStopTimetableIsLoading(false);
      const finalState = useMapStore.getState();
      expect(finalState.selectedStopTimetableIsLoading).toBe(false);
    });
  });

  describe("setSelectedStopTimetableIsLoaded", () => {
    it("should set loaded state", () => {
      const store = useMapStore.getState();
      store.setSelectedStopTimetableIsLoaded(true);

      const updatedState = useMapStore.getState();
      expect(updatedState.selectedStopTimetableIsLoaded).toBe(true);

      store.setSelectedStopTimetableIsLoaded(false);
      const finalState = useMapStore.getState();
      expect(finalState.selectedStopTimetableIsLoaded).toBe(false);
    });
  });

  describe("dataToCustomData", () => {
    it("should transform BusLineStopTimetable to CustomBusLineTimetable", () => {
      const store = useMapStore.getState();
      const mockData: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {
            "Destination A": [
              { minutos: "5.0", real: "S" },
              { minutos: "10.0", real: "N" },
            ],
            "Destination B": [{ minutos: "15.0", real: "S" }],
          },
        },
      ];

      const result = store.dataToCustomData(mockData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        lineId: 1,
        lineName: "Line 1",
        nextBuses: [
          { name: "Destination A", real: true, minutesLeft: "5 seg" },
          { name: "Destination A", real: false, minutesLeft: "10 seg" },
          { name: "Destination B", real: true, minutesLeft: "15 seg" },
        ],
      });
    });

    it("should handle empty trayectos", () => {
      const store = useMapStore.getState();
      const mockData: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {},
        },
      ];

      const result = store.dataToCustomData(mockData);

      expect(result).toHaveLength(1);
      expect(result[0].nextBuses).toEqual([]);
    });

    it("should handle multiple bus lines", () => {
      const store = useMapStore.getState();
      const mockData: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {
            "Destination A": [{ minutos: "5.0", real: "S" }],
          },
        },
        {
          idLinea: 2,
          desc_linea: "Line 2",
          trayectos: {
            "Destination B": [{ minutos: "10.0", real: "N" }],
          },
        },
      ];

      const result = store.dataToCustomData(mockData);

      expect(result).toHaveLength(2);
      expect(result[0].lineId).toBe(1);
      expect(result[1].lineId).toBe(2);
    });

    it("should extract minutes correctly from decimal format", () => {
      const store = useMapStore.getState();
      const mockData: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {
            "Destination A": [
              { minutos: "5.5", real: "S" },
              { minutos: "10.9", real: "N" },
            ],
          },
        },
      ];

      const result = store.dataToCustomData(mockData);

      expect(result[0].nextBuses[0].minutesLeft).toBe("5 seg");
      expect(result[0].nextBuses[1].minutesLeft).toBe("10 seg");
    });
  });

  describe("loadBusStopTimeTable", () => {
    it("should fetch and transform timetable data", async () => {
      const store = useMapStore.getState();
      const mockResponse: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {
            "Destination A": [{ minutos: "5.0", real: "S" }],
          },
        },
      ];

      global.fetch = mock(() =>
        Promise.resolve({
          json: async () => mockResponse,
        }),
      );

      await store.loadBusStopTimeTable(123, 1, 1);

      const finalState = useMapStore.getState();
      expect(finalState.selectedStopTimetableIsLoading).toBe(false);
      expect(finalState.selectedStopTimetableIsLoaded).toBe(true);
      expect(finalState.selectedStopTimetable).toBeDefined();
    });

    it("should filter out bus lines with no next buses", async () => {
      const store = useMapStore.getState();
      const mockResponse: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {
            "Destination A": [{ minutos: "5.0", real: "S" }],
          },
        },
        {
          idLinea: 2,
          desc_linea: "Line 2",
          trayectos: {},
        },
      ];

      global.fetch = mock(() =>
        Promise.resolve({
          json: async () => mockResponse,
        }),
      );

      await store.loadBusStopTimeTable(123, 1, 1);

      const finalState = useMapStore.getState();
      expect(finalState.selectedStopTimetable).toBeDefined();
      if (finalState.selectedStopTimetable) {
        expect(finalState.selectedStopTimetable.length).toBe(1);
        expect(finalState.selectedStopTimetable[0].lineId).toBe(1);
      }
    });

    it("should handle fetch errors gracefully", async () => {
      const store = useMapStore.getState();

      global.fetch = mock(() => Promise.reject(new Error("Network error")));

      await store.loadBusStopTimeTable(123, 1, 1);

      const finalState = useMapStore.getState();
      expect(finalState.selectedStopTimetableIsLoading).toBe(false);
      expect(finalState.selectedStopTimetableIsLoaded).toBe(true);
    });

    it("should set loading states correctly", async () => {
      const store = useMapStore.getState();
      const mockResponse: BusLineStopTimetable[] = [
        {
          idLinea: 1,
          desc_linea: "Line 1",
          trayectos: {
            "Destination A": [{ minutos: "5.0", real: "S" }],
          },
        },
      ];

      global.fetch = mock(() =>
        Promise.resolve({
          json: async () => mockResponse,
        }),
      );

      const loadPromise = store.loadBusStopTimeTable(123, 1, 1);

      // Check loading state is set immediately
      const loadingState = useMapStore.getState();
      expect(loadingState.selectedStopTimetableIsLoading).toBe(true);
      expect(loadingState.selectedStopTimetableIsLoaded).toBe(false);

      await loadPromise;

      const finalState = useMapStore.getState();
      expect(finalState.selectedStopTimetableIsLoading).toBe(false);
      expect(finalState.selectedStopTimetableIsLoaded).toBe(true);
    });
  });
});

