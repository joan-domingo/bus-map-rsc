import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { BusStop } from "../types";
import { BusLineBadge } from "./BusLineBadge";

interface Props {
  onClick: () => void;
  selected: boolean;
  stop: BusStop;
}

export const BusStopMarker = ({ stop, onClick, selected }: Props) => {
  const columns = Math.ceil(Math.sqrt(stop.buses.length));
  const rows: string[][] = [];

  for (let row = 0; row < Math.ceil(stop.buses.length / columns); row++) {
    rows.push(stop.buses.slice(row * columns, (row + 1) * columns));
  }

  return (
    <AdvancedMarker
      title={stop.name}
      onClick={onClick}
      position={{ lat: stop.lat, lng: stop.lon }}
      zIndex={selected ? 1 : 0}
      style={{ transition: "width 0.5s ease" }}
    >
      <div className="flex flex-row gap-0.5 rounded-lg bg-black/70 p-0.5">
        <div className="flex flex-col gap-0.5">
          {rows.map((row) => (
            <div
              key={row.join("-")}
              className="flex flex-row justify-center gap-0.5"
            >
              {row.map((lineStopId) => (
                <BusLineBadge key={lineStopId} lineStopId={lineStopId} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2"
        style={{
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "12px solid rgba(0, 0, 0, 0.7)",
        }}
      />
    </AdvancedMarker>
  );
};
