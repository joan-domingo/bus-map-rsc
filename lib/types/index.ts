export interface BusStop {
  id: number;
  name: string;
  lat: number;
  lon: number;
  buses: string[];
  lineId: number;
  zoneId: number;
}

export interface BusLineJourneyEndpoint {
  stop: string;
  municipality?: string;
}

export interface BusLineJourney {
  id: string;
  from: BusLineJourneyEndpoint;
  to: BusLineJourneyEndpoint;
}

export interface BusLineRouteData {
  journeys: BusLineJourney[];
  municipalities: string[];
}

export interface BusLineStopTimetableArrival {
  minutos: string;
  real: string;
  hora?: string;
}

export interface BusLineStopTimetable {
  idLinea: number | "N";
  desc_linea: string;
  trayectos: Record<
    string,
    BusLineStopTimetableArrival[] | Record<string, BusLineStopTimetableArrival>
  >;
}

export type CustomBusLineJourney =
  | { name: string; real: true; minutesLeft: string }
  | { name: string; real: false; departureTime: string };

export interface CustomBusLineTimetable {
  lineId: number;
  lineName: string;
  nextBuses: CustomBusLineJourney[];
}

export interface UserLocation {
  lat: number;
  lng: number;
}
