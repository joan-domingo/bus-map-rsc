import type { BusStop } from "../types";

export interface BusStopLineFilter {
  lineStopIds: string[];
  lineName: string;
}

export function filterBusStops(
  allBusStops: BusStop[],
  lineFilter: BusStopLineFilter | undefined,
  showOnlyStarred: boolean,
  starredStopIds: ReadonlySet<number>,
) {
  let stops = allBusStops;

  if (lineFilter) {
    const selectedLineStopIds = new Set(lineFilter.lineStopIds);
    stops = stops.filter((stop) =>
      stop.buses.some((lineStopId) => selectedLineStopIds.has(lineStopId)),
    );
  }

  if (showOnlyStarred) {
    stops = stops.filter((stop) => starredStopIds.has(stop.id));
  }

  return stops;
}
