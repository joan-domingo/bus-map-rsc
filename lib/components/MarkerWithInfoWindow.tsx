import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { useShallow } from "zustand/shallow";
import { useMapStore } from "../store/useMapStore";
import type { BusStop } from "../types";
import busLineData from "../utils/busLineData.json";
import MarkerTimetable from "./MarkerTimetable";

interface Props {
  onClick: () => void;
  onCloseClick: () => void;
  visible: boolean;
  stop: BusStop;
}

export const MarkerWithInfowindow = ({
  stop,
  onClick,
  visible,
  onCloseClick,
}: Props) => {
  const { selectedStopTimetable, isLoading, isLoaded } = useMapStore(
    useShallow((state) => ({
      selectedStopTimetable: state.selectedStopTimetable,
      isLoading: state.selectedStopTimetableIsLoading,
      isLoaded: state.selectedStopTimetableIsLoaded,
    })),
  );
  const [markerRef, marker] = useAdvancedMarkerRef();
  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        onClick={onClick}
        position={{ lat: stop.lat, lng: stop.lon }}
        zIndex={visible ? 1 : 0}
        style={{ transition: "width 0.5s ease" }}
      >
        <div className="flex flex-row bg-black/70 p-0.5 gap-0.5 rounded-lg">
          {(() => {
            const buses = stop.buses;
            const n = buses.length;
            const cols = Math.ceil(Math.sqrt(n));
            const rows = Math.ceil(n / cols);
            const grid: string[][] = [];
            for (let r = 0; r < rows; r++) {
              grid.push(buses.slice(r * cols, (r + 1) * cols));
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {grid.map((row, rowIdx) => (
                  <div
                    key={`${row.length}-${rowIdx}`}
                    style={{ display: "flex", flexDirection: "row", gap: 2 }}
                  >
                    {row.map((bus) => (
                      <div
                        key={bus}
                        className="flex items-center justify-center w-6 h-6 text-white text-xs rounded-md"
                        style={{
                          backgroundColor:
                            busLineData[bus as keyof typeof busLineData].color,
                        }}
                      >
                        {busLineData[bus as keyof typeof busLineData].name
                          .toUpperCase()
                          .replace("-", "")}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "12px solid rgba(0, 0, 0, 0.7)",
          }}
        />
      </AdvancedMarker>
      {visible && (
        <InfoWindow
          anchor={marker}
          shouldFocus
          minWidth={320}
          onCloseClick={onCloseClick}
          headerContent={
            <div className="flex text-black items-center">
              <div className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {stop.name}
              </div>
              <button
                className="w-8 h-8 border-none text-black text-3xl cursor-pointer flex items-center justify-center"
                style={{ background: "white" }}
                aria-label="Tanca"
                onClick={onCloseClick}
                type="button"
              >
                ×
              </button>
            </div>
          }
        >
          <MarkerTimetable
            selectedStopTimetable={selectedStopTimetable}
            isLoading={isLoading}
            isLoaded={isLoaded}
            visible={visible}
          />
        </InfoWindow>
      )}
    </>
  );
};
