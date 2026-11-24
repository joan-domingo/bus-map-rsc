import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  BusLineStopTimetable,
  CustomBusLineJourney,
  CustomBusLineTimetable,
} from "../types";

interface MapState {
  selectedStopTimetable: CustomBusLineTimetable[] | null;
  selectedStopTimetableIsLoaded: boolean;
  selectedStopTimetableIsLoading: boolean;
  selectedStopTimetableError: string | null;
  selectedStopTimetableUpdatedAt: number | null;
  loadBusStopTimeTable: (
    stopId: number,
    lineId: number,
    zoneId: number,
  ) => Promise<void>;
  clearSelectedBusStopTimetable: () => void;
  setSelectedStopTimetableIsLoading: (isLoading: boolean) => void;
  setSelectedStopTimetableIsLoaded: (isLoaded: boolean) => void;
  dataToCustomData: (data: BusLineStopTimetable[]) => CustomBusLineTimetable[];
}

function formatRealtimeArrivalTime(value: string): string {
  const hours = value.match(/(?:^|\s)(\d+)\s*h(?:\s|$)/i);
  const minutes = value.match(/(?:^|\s)(\d+)\s*min(?:\s|$)/i);
  const hoursLeft = Number(hours?.[1] ?? 0);
  const minutesLeft = Number(minutes?.[1] ?? 0);

  if (hoursLeft > 0) {
    return minutesLeft > 0
      ? `${hoursLeft} h ${minutesLeft} min`
      : `${hoursLeft} h`;
  }

  if (minutes?.[1]) {
    return `${minutes[1]} min`;
  }

  const seconds = value.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*s(?:\s|$)/i);
  if (seconds?.[1]) {
    const secondsLeft = Number(seconds[1]);
    return secondsLeft < 60 ? "<1 min" : `${Math.ceil(secondsLeft / 60)} min`;
  }

  throw new Error(`Unexpected real-time arrival time: ${value}`);
}

function formatScheduledDepartureTime(arrival: {
  hora?: string;
  minutos: string;
}): string | null {
  const scheduledTime = arrival.hora?.trim();
  if (scheduledTime && /^\d{1,2}:\d{2}$/.test(scheduledTime)) {
    return scheduledTime;
  }

  const minutesValue = arrival.minutos.trim();
  const minutes = minutesValue.match(/^(\d+)'/);
  if (minutes?.[1]) {
    return `${minutes[1]} min`;
  }

  if (!scheduledTime && !minutesValue) {
    return null;
  }

  throw new Error(`Unexpected scheduled departure time: ${arrival.minutos}`);
}

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      selectedStopTimetable: null,
      selectedStopTimetableIsLoaded: false,
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableError: null,
      selectedStopTimetableUpdatedAt: null,
      loadBusStopTimeTable: async (stopId, lineId, zoneId) => {
        set(
          {
            selectedStopTimetable: null,
            selectedStopTimetableError: null,
            selectedStopTimetableUpdatedAt: null,
          },
          false,
          "setSelectedStopTimetable",
        );
        get().setSelectedStopTimetableIsLoading(true);
        get().setSelectedStopTimetableIsLoaded(false);
        try {
          const response = await fetch(
            `https://glo6ir56yyjdlmdtig4ztnqu7q0dcwlz.lambda-url.eu-central-1.on.aws/api/json/GetTiemposParada/es/${stopId}/${lineId}/${zoneId}`,
          );
          if (!response.ok) {
            throw new Error(
              `Timetable request failed with status ${response.status}`,
            );
          }
          const data: BusLineStopTimetable[] = await response.json();

          const filteredData = get()
            .dataToCustomData(data)
            .filter((busLine) => busLine.nextBuses.length > 0);

          set(
            {
              selectedStopTimetable: filteredData,
              selectedStopTimetableUpdatedAt: Date.now(),
              selectedStopTimetableError: null,
            },
            false,
            "setSelectedStopTimetable",
          );
        } catch (error) {
          console.error("Error loading bus stop timetable:", error);
          set(
            {
              selectedStopTimetable: null,
              selectedStopTimetableError:
                error instanceof Error
                  ? error.message
                  : "Unknown timetable error",
            },
            false,
            "setSelectedStopTimetableError",
          );
        } finally {
          get().setSelectedStopTimetableIsLoading(false);
          get().setSelectedStopTimetableIsLoaded(true);
        }
      },
      clearSelectedBusStopTimetable: () => {
        set(
          {
            selectedStopTimetable: null,
            selectedStopTimetableError: null,
            selectedStopTimetableUpdatedAt: null,
            selectedStopTimetableIsLoading: false,
            selectedStopTimetableIsLoaded: false,
          },
          false,
          "clearSelectedBusStopTimetable",
        );
      },
      setSelectedStopTimetableIsLoaded: (isLoaded: boolean) => {
        set(
          { selectedStopTimetableIsLoaded: isLoaded },
          false,
          "setSelectedStopTimetableIsLoaded",
        );
      },
      setSelectedStopTimetableIsLoading: (isLoading: boolean) => {
        set(
          { selectedStopTimetableIsLoading: isLoading },
          false,
          "setSelectedStopTimetableIsLoading",
        );
      },
      dataToCustomData: (data) => {
        return data
          .filter(
            (
              busLineStopTimetable,
            ): busLineStopTimetable is BusLineStopTimetable & {
              idLinea: number;
            } => typeof busLineStopTimetable.idLinea === "number",
          )
          .map((busLineStopTimetable) => {
            const { idLinea, desc_linea } = busLineStopTimetable;
            const nextBuses: CustomBusLineJourney[] = [];

            for (const [journeyDestination, departures] of Object.entries(
              busLineStopTimetable.trayectos,
            )) {
              const journeyNextBuses = Array.isArray(departures)
                ? departures
                : Object.values(departures);

              for (const arrival of journeyNextBuses) {
                if (arrival.real === "S") {
                  nextBuses.push({
                    name: journeyDestination,
                    real: true,
                    minutesLeft: formatRealtimeArrivalTime(arrival.minutos),
                  });
                } else if (arrival.real === "N") {
                  const departureTime = formatScheduledDepartureTime(arrival);
                  if (!departureTime) {
                    console.warn(
                      `Skipping scheduled departure without a time for line ${idLinea}`,
                    );
                    continue;
                  }

                  nextBuses.push({
                    name: journeyDestination,
                    real: false,
                    departureTime,
                  });
                } else {
                  throw new Error(
                    `Unexpected real-time status for line ${idLinea}: ${arrival.real}`,
                  );
                }
              }
            }

            return {
              lineId: idLinea,
              lineName: desc_linea,
              nextBuses,
            };
          });
      },
    }),
    { name: "mapStore" },
  ),
);
