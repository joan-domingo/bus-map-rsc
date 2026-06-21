import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { BusStop } from "../lib/types";

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
  Parada?: {
    DESC_PARADA?: string;
    LATITUD?: number;
    LONGITUD?: number;
    ID_ZONA?: number;
  };
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
