import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BusStop } from "../lib/types";

export async function loadAllBusStops(): Promise<BusStop[]> {
  try {
    // Load all bus stops from the all.json file in public/stops
    const allStopsPath = join(process.cwd(), "public", "stops", "all.json");

    if (!existsSync(allStopsPath)) {
      console.error("all.json not found in public/stops");
      return [];
    }

    const fileContent = readFileSync(allStopsPath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error loading all bus stops:", error);
    return [];
  }
}
