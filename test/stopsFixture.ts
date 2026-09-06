import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { BusStop } from "../lib/types";

/**
 * The data loader resolves its paths from process.cwd(), so page tests point
 * cwd at a throwaway public/stops directory instead of loading the 3.5k-stop
 * production archive.
 */
export interface StopsFixture {
  root: string;
  /**
   * Runs `task` with cwd pointed at the fixture, keeping it pointed there until
   * the task settles — the loaders are async, so restoring cwd synchronously
   * would send later reads back to the real public/stops directory.
   */
  use<T>(task: () => T | Promise<T>): Promise<T>;
  cleanup(): void;
}

export function createStopsFixture(
  allStops: BusStop[],
  lineFiles: Record<string, unknown[]> = {},
): StopsFixture {
  const root = mkdtempSync(join(tmpdir(), "bus-map-page-"));
  const stopsDir = join(root, "public", "stops");
  mkdirSync(stopsDir, { recursive: true });
  writeFileSync(
    join(stopsDir, "all.json.gz"),
    gzipSync(Buffer.from(JSON.stringify(allStops))),
  );
  for (const [lineId, stops] of Object.entries(lineFiles)) {
    writeFileSync(join(stopsDir, `${lineId}.json`), JSON.stringify(stops));
  }

  const realCwd = process.cwd;
  return {
    root,
    async use(task) {
      process.cwd = () => root;
      try {
        return await task();
      } finally {
        process.cwd = realCwd;
      }
    },
    cleanup() {
      process.cwd = realCwd;
      rmSync(root, { recursive: true, force: true });
    },
  };
}
