import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { BusLineStopTimetable } from "../../types";
import { useMapStore } from "../useMapStore";

const originalFetch = globalThis.fetch;

function response(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const liveAndScheduledData: BusLineStopTimetable[] = [
  {
    idLinea: 1,
    desc_linea: "C1 - SABADELL - CASTELLAR",
    trayectos: {
      Sabadell: [
        { minutos: "14 min 01.9614587 s", real: "S" },
        { minutos: "44 min 01.9614587 s", real: "S" },
      ],
      "SABADELL ESTACIÓ BUS - CASTELLAR DEL VALLÈS": {
        "00115": { minutos: "15' 00''", real: "N", hora: "14:56" },
        "00145": { minutos: "45' 00''", real: "N", hora: "15:26" },
      },
    },
  },
];

describe("useMapStore", () => {
  beforeEach(() => {
    useMapStore.getState().clearSelectedBusStopTimetable();
    useMapStore.getState().setSelectedStopTimetableIsLoading(false);
    useMapStore.getState().setSelectedStopTimetableIsLoaded(false);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("clears the selected stop timetable and its request state", () => {
    useMapStore.setState({
      selectedStopTimetable: [],
      selectedStopTimetableIsLoading: true,
      selectedStopTimetableIsLoaded: true,
      selectedStopTimetableError: "Network error",
      selectedStopTimetableUpdatedAt: 123,
    });

    useMapStore.getState().clearSelectedBusStopTimetable();

    expect(useMapStore.getState()).toMatchObject({
      selectedStopTimetable: null,
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: false,
      selectedStopTimetableError: null,
      selectedStopTimetableUpdatedAt: null,
    });
  });

  it("sets loading state", () => {
    useMapStore.getState().setSelectedStopTimetableIsLoading(true);
    expect(useMapStore.getState().selectedStopTimetableIsLoading).toBe(true);

    useMapStore.getState().setSelectedStopTimetableIsLoading(false);
    expect(useMapStore.getState().selectedStopTimetableIsLoading).toBe(false);
  });

  it("sets loaded state", () => {
    useMapStore.getState().setSelectedStopTimetableIsLoaded(true);
    expect(useMapStore.getState().selectedStopTimetableIsLoaded).toBe(true);
  });

  it("converts realtime ETAs and scheduled clock times", () => {
    const result = useMapStore
      .getState()
      .dataToCustomData(liveAndScheduledData);

    expect(result).toEqual([
      {
        lineId: 1,
        lineName: "C1 - SABADELL - CASTELLAR",
        nextBuses: [
          { name: "Sabadell", real: true, minutesLeft: "14 min" },
          { name: "Sabadell", real: true, minutesLeft: "44 min" },
          {
            name: "SABADELL ESTACIÓ BUS - CASTELLAR DEL VALLÈS",
            real: false,
            departureTime: "14:56",
          },
          {
            name: "SABADELL ESTACIÓ BUS - CASTELLAR DEL VALLÈS",
            real: false,
            departureTime: "15:26",
          },
        ],
      },
    ]);
  });

  it("formats sub-minute realtime arrivals", () => {
    const result = useMapStore.getState().dataToCustomData([
      {
        idLinea: 1,
        desc_linea: "C1",
        trayectos: {
          Sabadell: [{ minutos: "35.5 s", real: "S" }],
        },
      },
    ]);

    expect(result[0]?.nextBuses[0]).toEqual({
      name: "Sabadell",
      real: true,
      minutesLeft: "<1 min",
    });
  });

  it("skips scheduled departures without a time and warns", () => {
    const originalWarn = console.warn;
    const warning = mock(() => undefined);
    console.warn = warning;

    try {
      const result = useMapStore.getState().dataToCustomData([
        {
          idLinea: 1,
          desc_linea: "C1",
          trayectos: {
            Sabadell: [
              { minutos: " ", real: "N", hora: " " },
              { minutos: "5 min 0 s", real: "S" },
              { minutos: "15' 00''", real: "N", hora: "14:56" },
            ],
          },
        },
      ]);

      expect(result[0]?.nextBuses).toEqual([
        { name: "Sabadell", real: true, minutesLeft: "5 min" },
        { name: "Sabadell", real: false, departureTime: "14:56" },
      ]);
      expect(warning).toHaveBeenCalledWith(
        "Skipping scheduled departure without a time for line 1",
      );
    } finally {
      console.warn = originalWarn;
    }
  });

  it("handles empty journeys and multiple lines", () => {
    const result = useMapStore.getState().dataToCustomData([
      {
        idLinea: 1,
        desc_linea: "C1",
        trayectos: {},
      },
      {
        idLinea: 2,
        desc_linea: "C2",
        trayectos: {
          Sabadell: [{ minutos: "5 min 0 s", real: "S" }],
        },
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]?.nextBuses).toEqual([]);
    expect(result[1]?.lineId).toBe(2);
  });

  it("fetches and stores transformed departures", async () => {
    globalThis.fetch = mock(async () =>
      response(liveAndScheduledData),
    ) as unknown as typeof fetch;

    await useMapStore.getState().loadBusStopTimeTable(4605, 1, 0);

    expect(useMapStore.getState()).toMatchObject({
      selectedStopTimetable: [
        {
          lineId: 1,
          nextBuses: expect.arrayContaining([
            { name: "Sabadell", real: true, minutesLeft: "14 min" },
            {
              name: "SABADELL ESTACIÓ BUS - CASTELLAR DEL VALLÈS",
              real: false,
              departureTime: "14:56",
            },
          ]),
        },
      ],
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: true,
      selectedStopTimetableError: null,
    });
    expect(
      useMapStore.getState().selectedStopTimetableUpdatedAt,
    ).not.toBeNull();
  });

  it("filters lines that have no upcoming buses", async () => {
    globalThis.fetch = mock(async () =>
      response([
        ...liveAndScheduledData,
        { idLinea: 2, desc_linea: "C2", trayectos: {} },
      ]),
    ) as unknown as typeof fetch;

    await useMapStore.getState().loadBusStopTimeTable(4605, 1, 0);

    expect(
      useMapStore.getState().selectedStopTimetable?.map((line) => line.lineId),
    ).toEqual([1]);
  });

  it("treats the API no-service sentinel as no upcoming buses", async () => {
    globalThis.fetch = mock(async () =>
      response([
        {
          idLinea: "N",
          desc_linea: "N",
          trayectos: {
            N: {
              "0N": { minutos: " ", real: "N", hora: "N" },
            },
          },
        },
      ]),
    ) as unknown as typeof fetch;

    await useMapStore.getState().loadBusStopTimeTable(5180, 1, 0);

    expect(useMapStore.getState()).toMatchObject({
      selectedStopTimetable: [],
      selectedStopTimetableError: null,
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: true,
    });
  });

  it("surfaces and logs request errors", async () => {
    const originalConsoleError = console.error;
    const consoleError = mock();
    console.error = consoleError;
    globalThis.fetch = mock(async () => {
      throw new Error("Network error");
    }) as unknown as typeof fetch;

    await useMapStore.getState().loadBusStopTimeTable(4605, 1, 0);

    expect(useMapStore.getState()).toMatchObject({
      selectedStopTimetable: null,
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: true,
      selectedStopTimetableError: "Network error",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Error loading bus stop timetable:",
      expect.any(Error),
    );
    console.error = originalConsoleError;
  });

  it("rejects unsuccessful HTTP responses", async () => {
    const originalConsoleError = console.error;
    console.error = mock();
    globalThis.fetch = mock(async () =>
      response([], 503),
    ) as unknown as typeof fetch;

    await useMapStore.getState().loadBusStopTimeTable(4605, 1, 0);

    expect(useMapStore.getState().selectedStopTimetableError).toBe(
      "Timetable request failed with status 503",
    );
    console.error = originalConsoleError;
  });

  it("sets loading state before awaiting the response", async () => {
    let resolveResponse: ((value: Response) => void) | undefined;
    globalThis.fetch = mock(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    ) as unknown as typeof fetch;

    const loadPromise = useMapStore.getState().loadBusStopTimeTable(4605, 1, 0);

    expect(useMapStore.getState().selectedStopTimetableIsLoading).toBe(true);
    expect(useMapStore.getState().selectedStopTimetableIsLoaded).toBe(false);

    resolveResponse?.(response(liveAndScheduledData));
    await loadPromise;

    expect(useMapStore.getState().selectedStopTimetableIsLoading).toBe(false);
    expect(useMapStore.getState().selectedStopTimetableIsLoaded).toBe(true);
  });
});
