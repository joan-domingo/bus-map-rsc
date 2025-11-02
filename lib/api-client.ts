import type { BusLineStopTimetable } from "./types";

export async function fetchBusStopTimetable(
  stopId: number,
  lineId: number,
  zoneId: number,
): Promise<BusLineStopTimetable[]> {
  const response = await fetch(
    `https://glo6ir56yyjdlmdtig4ztnqu7q0dcwlz.lambda-url.eu-central-1.on.aws/api/json/GetTiemposParada/es/${stopId}/${lineId}/${zoneId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch timetable: ${response.statusText}`);
  }

  return await response.json();
}
