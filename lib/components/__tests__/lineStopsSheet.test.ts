import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STOPS_SHEET_PEEK } from "../lineStopsSheet";

const read = (name: string) =>
  readFileSync(join(import.meta.dir, "..", name), "utf-8");

describe("STOPS_SHEET_PEEK", () => {
  it("is a CSS length the map height can be built from", () => {
    expect(STOPS_SHEET_PEEK).toMatch(/^[\d.]+(rem|px)$/);
  });

  /**
   * A server component importing a value from a "use client" module gets a
   * client reference proxy rather than the value. Interpolating that into a
   * template literal yields invalid CSS -- silently, since it typechecks and
   * bun imports the module directly with no client/server boundary. The line
   * page is a server component, so its source of this constant must not be a
   * client module.
   */
  it("comes from a module that is not a client component", () => {
    expect(read("lineStopsSheet.ts")).not.toContain("use client");
  });

  it("is not re-exported by the client component that uses it", () => {
    const sheet = read("LineStopsSection.tsx");

    expect(sheet).toContain('"use client"');
    expect(sheet).not.toMatch(/export const STOPS_SHEET_PEEK/);
  });

  it("reaches the line page without crossing the client boundary", () => {
    const page = readFileSync(
      join(
        import.meta.dir,
        "..",
        "..",
        "..",
        "app",
        "linea",
        "[line]",
        "page.tsx",
      ),
      "utf-8",
    );

    expect(page).toContain(
      'import { STOPS_SHEET_PEEK } from "../../../lib/components/lineStopsSheet"',
    );
    expect(page).not.toMatch(
      /STOPS_SHEET_PEEK[^;]*from "[^"]*LineStopsSection"/,
    );
  });
});
