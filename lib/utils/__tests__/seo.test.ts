import {
  buildHomePageSeo,
  buildLinePagePath,
  buildLinePageSeo,
  buildLineOgImagePath,
  lineNameToSlug,
  lineStopIdToSlug,
  resolveLineSlug,
} from "../seo";

describe("buildLinePageSeo", () => {
  it("leads with bus line code and bilingual real-time keywords", () => {
    const seo = buildLinePageSeo("n80");
    expect(seo.title).toBe("Bus N80 temps real · Moventis");
    expect(seo.description).toContain("N80");
    expect(seo.description).toContain("tiempo real");
    expect(seo.description).toContain("bus N80");
  });
});

describe("lineNameToSlug", () => {
  it("normalizes line names for URLs", () => {
    expect(lineNameToSlug("C-30")).toBe("c30");
    expect(lineNameToSlug("N-80")).toBe("n80");
  });
});

describe("lineStopIdToSlug", () => {
  it("maps internal ids to name slugs, not ids", () => {
    expect(lineStopIdToSlug("1")).toBe("c1");
    expect(lineStopIdToSlug("14")).toBe("b1");
  });
});

describe("buildLinePagePath", () => {
  it("builds line URLs from slugs only", () => {
    expect(buildLinePagePath("n80")).toBe("/linea/n80");
  });
});

describe("buildLineOgImagePath", () => {
  it("returns a stable og-image URL per line slug", () => {
    expect(buildLineOgImagePath("N80")).toBe("/og-image/n80");
  });
});

describe("resolveLineSlug", () => {
  it("resolves line name slugs", () => {
    const resolved = resolveLineSlug("c1");
    expect(resolved?.canonicalSlug).toBe("c1");
    expect(resolved?.lineName).toBe("C1");
  });

  it("does not resolve internal numeric ids as URLs", () => {
    expect(resolveLineSlug("1")).toBeNull();
    expect(resolveLineSlug("14")).toBeNull();
    expect(resolveLineSlug("30")).toBeNull();
  });

  it("returns null for unknown slugs", () => {
    expect(resolveLineSlug("99999")).toBeNull();
    expect(resolveLineSlug("122")).toBeNull();
  });
});

describe("buildHomePageSeo", () => {
  it("targets moventis temps real and tiempo real queries", () => {
    const seo = buildHomePageSeo();
    expect(seo.title).toContain("Moventis");
    expect(seo.title).toContain("temps real");
    expect(seo.description).toContain("temps real");
  });
});
