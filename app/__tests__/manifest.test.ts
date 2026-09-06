import { describe, expect, it } from "bun:test";
import manifest from "../manifest";

describe("manifest", () => {
  const value = manifest();

  it("installs as a standalone Catalan app", () => {
    expect(value).toMatchObject({
      name: "QuanTriga.com - Temps Real Autobusos",
      short_name: "QuanTriga",
      start_url: "/",
      display: "standalone",
      lang: "ca",
      dir: "ltr",
      orientation: "any",
    });
  });

  it("uses the brand teal for both chrome colors", () => {
    expect(value.background_color).toBe("#088b9f");
    expect(value.theme_color).toBe("#088b9f");
  });

  it("ships a scalable icon and transport categories", () => {
    expect(value.icons).toEqual([
      { src: "/busIcon.svg", sizes: "any", type: "image/svg+xml" },
    ]);
    expect(value.categories).toEqual(["transport", "travel"]);
  });
});
