import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
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
