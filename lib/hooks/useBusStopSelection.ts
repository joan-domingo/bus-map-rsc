import { useCallback, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useMapStore } from "../store/useMapStore";
import type { BusStop } from "../types";
import { trackEvent } from "../utils/analytics";

export const useBusStopSelection = () => {
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);

  const { loadBusStopTimeTable, clearSelectedBusStopTimetable } = useMapStore(
    useShallow((state) => ({
      loadBusStopTimeTable: state.loadBusStopTimeTable,
      clearSelectedBusStopTimetable: state.clearSelectedBusStopTimetable,
    })),
  );

  const selectStop = useCallback(
    async (stop: BusStop) => {
      const { id, lineId, zoneId } = stop;

      // Track bus stop click event
      trackEvent("bus_stop_click", {
        stop_id: id,
        stop_name: stop.name,
        bus_lines: stop.buses.join(","),
        line_id: lineId,
        zone_id: zoneId,
      });

      // Clear previous timetable and set new selection
      clearSelectedBusStopTimetable();
      setSelectedStopId(id);

      // Load new timetable
      await loadBusStopTimeTable(id, lineId, zoneId);
    },
    [loadBusStopTimeTable, clearSelectedBusStopTimetable],
  );

  const clearSelection = useCallback(() => {
    setSelectedStopId(null);
    clearSelectedBusStopTimetable();
  }, [clearSelectedBusStopTimetable]);

  return {
    selectedStopId,
    selectStop,
    clearSelection,
  };
};
