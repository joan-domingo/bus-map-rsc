import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type {
  BusLineJourney,
  BusLineJourneyEndpoint,
  BusLineRouteData,
  BusStop,
} from "../lib/types";

const LOWERCASE_MUNICIPALITY_PARTICLES = new Set([
  "de",
  "del",
  "dels",
  "el",
  "els",
  "i",
  "la",
  "les",
]);

export async function loadAllBusStops(): Promise<BusStop[]> {
  try {
    // Load all bus stops from the compressed all.json.gz file in public/stops
    const allStopsPath = join(process.cwd(), "public", "stops", "all.json.gz");

    if (!existsSync(allStopsPath)) {
      console.error("all.json.gz not found in public/stops");
      return [];
    }

    const compressedContent = readFileSync(allStopsPath);
    const fileContent = gunzipSync(compressedContent).toString("utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error loading all bus stops:", error);
    return [];
  }
}

interface MoventisRawStop {
  ID_LINEA: number;
  ID_PARADA: number;
  ID_TRAYECTO?: number;
  SECUENCIA?: number;
  Parada?: {
    DESC_PARADA?: string;
    LATITUD?: number;
    LONGITUD?: number;
    MUNICIPIO?: string;
    ID_ZONA?: number;
  };
}

interface SequencedEndpoint extends BusLineJourneyEndpoint {
  sequence: number;
}

interface SequencedJourney {
  from: SequencedEndpoint;
  to: SequencedEndpoint;
}

function formatMunicipalityName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("ca")
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && LOWERCASE_MUNICIPALITY_PARTICLES.has(word)) {
        return word;
      }

      return word.replace(
        /(^|[-'])(\p{L})/gu,
        (_match, separator, letter) =>
          `${separator}${letter.toLocaleUpperCase("ca")}`,
      );
    })
    .join(" ");
}

function toBusStop(stop: MoventisRawStop): BusStop | null {
  if (
    !stop?.ID_PARADA ||
    !stop.Parada?.DESC_PARADA ||
    typeof stop.Parada.LATITUD !== "number" ||
    typeof stop.Parada.LONGITUD !== "number"
  ) {
    return null;
  }

  const lineId = String(stop.ID_LINEA);

  return {
    id: stop.ID_PARADA,
    name: stop.Parada.DESC_PARADA,
    lat: stop.Parada.LATITUD,
    lon: stop.Parada.LONGITUD,
    buses: [lineId],
    lineId: stop.ID_LINEA,
    zoneId: stop.Parada.ID_ZONA ?? 0,
  };
}

export async function loadBusStopsForLineIds(
  lineIds: string[],
): Promise<BusStop[]> {
  const stopsById = new Map<number, BusStop>();

  for (const lineId of lineIds) {
    try {
      const lineStopsPath = join(
        process.cwd(),
        "public",
        "stops",
        `${lineId}.json`,
      );

      if (!existsSync(lineStopsPath)) {
        continue;
      }

      const fileContent = readFileSync(lineStopsPath, "utf-8");
      const rawStops = JSON.parse(fileContent) as MoventisRawStop[];

      for (const rawStop of rawStops) {
        const stop = toBusStop(rawStop);
        if (!stop) {
          continue;
        }

        const existingStop = stopsById.get(stop.id);
        if (existingStop) {
          existingStop.buses = Array.from(
            new Set([...existingStop.buses, ...stop.buses]),
          );
          continue;
        }

        stopsById.set(stop.id, stop);
      }
    } catch (error) {
      console.error(`Error loading stops for line ${lineId}:`, error);
    }
  }

  return Array.from(stopsById.values());
}

export async function loadBusLineRouteData(
  lineIds: string[],
): Promise<BusLineRouteData> {
  const journeysByTrip = new Map<string, SequencedJourney>();
  const municipalities = new Set<string>();

  for (const lineId of lineIds) {
    try {
      const lineStopsPath = join(
        process.cwd(),
        "public",
        "stops",
        `${lineId}.json`,
      );

      if (!existsSync(lineStopsPath)) {
        continue;
      }

      const fileContent = readFileSync(lineStopsPath, "utf-8");
      const rawStops = JSON.parse(fileContent) as MoventisRawStop[];

      for (const rawStop of rawStops) {
        const stop = rawStop?.Parada;
        if (!stop) {
          continue;
        }

        const municipality =
          typeof stop.MUNICIPIO === "string" && stop.MUNICIPIO.trim()
            ? formatMunicipalityName(stop.MUNICIPIO)
            : undefined;
        if (municipality) {
          municipalities.add(municipality);
        }

        if (
          typeof rawStop.ID_TRAYECTO !== "number" ||
          typeof rawStop.SECUENCIA !== "number" ||
          !stop.DESC_PARADA
        ) {
          continue;
        }

        const endpoint: SequencedEndpoint = {
          sequence: rawStop.SECUENCIA,
          stop: stop.DESC_PARADA,
          ...(municipality ? { municipality } : {}),
        };
        const journeyId = `${lineId}:${rawStop.ID_TRAYECTO}`;
        const journey = journeysByTrip.get(journeyId);

        if (!journey) {
          journeysByTrip.set(journeyId, {
            from: endpoint,
            to: endpoint,
          });
          continue;
        }

        if (endpoint.sequence < journey.from.sequence) {
          journey.from = endpoint;
        }
        if (endpoint.sequence > journey.to.sequence) {
          journey.to = endpoint;
        }
      }
    } catch (error) {
      console.error(`Error loading route data for line ${lineId}:`, error);
    }
  }

  const journeys: BusLineJourney[] = [];
  for (const [id, journey] of journeysByTrip) {
    if (
      journey.from.sequence === journey.to.sequence ||
      journey.from.stop === journey.to.stop
    ) {
      continue;
    }

    const { sequence: _fromSequence, ...from } = journey.from;
    const { sequence: _toSequence, ...to } = journey.to;
    journeys.push({ id, from, to });
  }

  return {
    journeys,
    municipalities: Array.from(municipalities),
  };
}
