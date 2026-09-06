import type { CustomBusLineTimetable } from "../types";
import busLineData from "../utils/busLineData.json";
import {
  buildLinePagePath,
  getLineStopDisplayName,
  lineStopIdToSlug,
} from "../utils/seo";

interface Props {
  selectedStopTimetable: CustomBusLineTimetable[];
  isLoading: boolean;
  isLoaded: boolean;
  visible: boolean;
}

const MarkerTimetable = ({
  selectedStopTimetable,
  isLoading,
  isLoaded,
  visible,
}: Props) => {
  if (!visible) {
    return null;
  }

  return (
    <div>
      {isLoading && (
        <div className="flex flex-1 items-center justify-center p-2 text-black">
          <div className="border-4 border-gray-200 border-t-gray-600 rounded-full w-6 h-6 animate-spin" />
        </div>
      )}
      {isLoaded && !selectedStopTimetable && (
        <div className="flex flex-1 items-center justify-center p-2 text-black">
          No s'han pogut carregar les dades. Si us plau, torna-ho a intentar més
          tard.
        </div>
      )}
      {isLoaded &&
        selectedStopTimetable &&
        selectedStopTimetable.length === 0 && (
          <div className="flex flex-1 items-center justify-center p-2 text-black">
            Cap autobús previst properament.
          </div>
        )}
      {isLoaded &&
        selectedStopTimetable &&
        selectedStopTimetable.length > 0 &&
        selectedStopTimetable.map((stop, index) => {
          const lineStopId = stop.lineId.toString();
          const lineSlug = lineStopIdToSlug(lineStopId);
          const headerStyle = {
            color:
              busLineData[lineStopId as keyof typeof busLineData]?.color ||
              "black",
          };
          return (
            <div
              key={stop.lineId}
              className={`flex flex-col flex-1 p-1 text-black ${index % 2 === 0 ? "bg-gray-100" : ""}`}
            >
              {lineSlug ? (
                <a
                  className="font-bold py-1 hover:underline"
                  href={buildLinePagePath(lineSlug)}
                  style={headerStyle}
                  title={`Veure les parades de la línia ${getLineStopDisplayName(lineStopId)}`}
                >
                  {stop.lineName}
                </a>
              ) : (
                <div className="font-bold py-1" style={headerStyle}>
                  {stop.lineName}
                </div>
              )}
              {stop.nextBuses.map((bus) => {
                return (
                  <div
                    key={`${bus.minutesLeft}-${bus.name}`}
                    style={{ display: "flex" }}
                  >
                    <div style={{ fontWeight: "bold", marginRight: "8px" }}>
                      {bus.minutesLeft}
                    </div>
                    <div>- Direcció {bus.name}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
};

export default MarkerTimetable;
