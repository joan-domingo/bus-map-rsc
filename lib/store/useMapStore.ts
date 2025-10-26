import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  BusLineStopTimetable,
  CustomBusLineJourney,
  CustomBusLineTimetable,
} from "../types";

interface MapState {
  selectedStopTimetable: CustomBusLineTimetable[];
  selectedStopTimetableIsLoaded: boolean;
  selectedStopTimetableIsLoading: boolean;
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

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      loadBusStopTimeTable: async (stopId, lineId, zoneId) => {
        set(
          { selectedStopTimetable: undefined },
          false,
          "setSelectedStopTimetable",
        );
        get().setSelectedStopTimetableIsLoading(true);
        get().setSelectedStopTimetableIsLoaded(false);
        try {
          const response = await fetch(
            `https://glo6ir56yyjdlmdtig4ztnqu7q0dcwlz.lambda-url.eu-central-1.on.aws/api/json/GetTiemposParada/es/${stopId}/${lineId}/${zoneId}`,
          );
          const data = await response.json();

          const filteredData = get()
            .dataToCustomData(data)
            .filter((busLine) => busLine.nextBuses.length > 0);

          set(
            { selectedStopTimetable: filteredData },
            false,
            "setSelectedStopTimetable",
          );
        } catch {
        } finally {
          get().setSelectedStopTimetableIsLoading(false);
          get().setSelectedStopTimetableIsLoaded(true);
        }
      },
      clearSelectedBusStopTimetable: () => {
        set(
          { selectedStopTimetable: [] },
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
        return data.map((busLineStopTimetable) => {
          const { idLinea, desc_linea } = busLineStopTimetable;

          const journeyNextBusesByDestination = Object.values(
            busLineStopTimetable.trayectos,
          );
          const journeyDestinations = Object.keys(
            busLineStopTimetable.trayectos,
          );
          const nextBuses: CustomBusLineJourney[] = [];

          for (let i = 0, len = journeyDestinations.length; i < len; i++) {
            const journeyDestination = journeyDestinations[i];
            const journeyNextBuses = journeyNextBusesByDestination[i];

            if (Array.isArray(journeyNextBuses)) {
              for (let i = 0, len = journeyNextBuses.length; i < len; i++) {
                const journeyNextBus = journeyNextBuses[i];
                if (journeyNextBus) {
                  nextBuses.push({
                    name: journeyDestination,
                    real: journeyNextBus.real && journeyNextBus.real === "S",
                    minutesLeft: `${journeyNextBus.minutos.split(".")[0]} seg`,
                  });
                }
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
