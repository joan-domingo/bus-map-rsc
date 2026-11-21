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

export interface BusLineStopTimetable {
  idLinea: number;
  desc_linea: string;
  trayectos: Record<
    string,
    Array<{
      minutos: string;
      real: string;
    }>
  >;
}

export interface CustomBusLineJourney {
  name: string;
  real: boolean;
  minutesLeft: string;
}

export interface CustomBusLineTimetable {
  lineId: number;
  lineName: string;
  nextBuses: CustomBusLineJourney[];
}

export interface UserLocation {
  lat: number;
  lng: number;
}
