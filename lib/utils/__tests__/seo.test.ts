import { describe, expect, it } from "bun:test";
import busLineData from "../busLineData.json";
import {
  buildHomePageSeo,
  buildLineOgImagePath,
  buildLinePagePath,
  buildLinePagePathFromName,
  buildLinePageSeo,
  getAllLineSlugs,
  getAllSeoLineEntries,
  getCanonicalLineName,
  getLineIdsBySlug,
  getLineOgImagePath,
  getLineStopBadgeLabel,
  getLineStopColor,
  getLineStopDisplayName,
  getLineStopTextColor,
  getPriorityLineSlugs,
  getVisiblePriorityLineSlugs,
  lineNameToSlug,
  lineStopIdToSlug,
  resolveLineSlug,
} from "../seo";

describe("buildLinePageSeo", () => {
  it("leads with bus line code and bilingual real-time keywords", () => {
    const seo = buildLinePageSeo("n80");
    expect(seo.title).toBe("Bus N80 temps real i tiempo real · Moventis");
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

  it("maps Search Console alias ids to public line codes", () => {
    expect(lineStopIdToSlug("68")).toBe("n80");
    expect(lineStopIdToSlug("59")).toBe("c30");
    expect(lineStopIdToSlug("335")).toBe("806");
  });
});

describe("line stop display helpers", () => {
  it("uses Search Console alias labels and color fallbacks", () => {
    expect(getLineStopDisplayName("68")).toBe("N80");
    expect(getLineStopDisplayName("335")).toBe("806");
    // Non-aliased ids fall back to the raw busLineData name
    expect(getLineStopDisplayName("1")).toBe("C1");
    // Unknown ids fall back to the id itself, and to the brand teal color
    expect(getLineStopDisplayName("does-not-exist")).toBe("does-not-exist");
    expect(getLineStopColor("does-not-exist")).toBe("#088b9f");
    // Known ids keep their own color, alias or not
    expect(getLineStopColor("68")).toBe("#1E003C");
  });

  it("shortens badge labels so they fit the marker", () => {
    expect(getLineStopBadgeLabel("444")).toBe("V4.1"); // "Línia V4.1"
    expect(getLineStopBadgeLabel("53")).toBe("C10"); // "C-10"
    expect(getLineStopBadgeLabel("457")).toBe("L9 LLOTOS"); // "L9 LLO-TOS"
    expect(getLineStopBadgeLabel("711")).toBe("TAD CT");
  });

  it("picks the readable text color for each line background", () => {
    // "53" is C-10, a bright lime where white text is unreadable
    expect(getLineStopColor("53")).toBe("#9AFF1F");
    expect(getLineStopTextColor("53")).toBe("#000000");
    // "76" is line 4, a pale cyan that also needs black
    expect(getLineStopColor("76")).toBe("#ACFFFF");
    expect(getLineStopTextColor("76")).toBe("#000000");
    // "38" is N66, a dark purple where white wins
    expect(getLineStopColor("38")).toBe("#56009A");
    expect(getLineStopTextColor("38")).toBe("#ffffff");
  });

  it("keeps white text on reds across the whole red range", () => {
    // "628" (#D40011) and "130" (#FF134A) are opposite ends of the reds
    expect(getLineStopColor("628")).toBe("#D40011");
    expect(getLineStopTextColor("628")).toBe("#ffffff");
    expect(getLineStopColor("130")).toBe("#FF134A");
    expect(getLineStopTextColor("130")).toBe("#ffffff");
    // "1" is C1 (#F70046), mid-range, previously flipped to black
    expect(getLineStopTextColor("1")).toBe("#ffffff");
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

  it("resolves Search Console aliases to local Moventis line ids", () => {
    expect(resolveLineSlug("n80")).toEqual({
      canonicalSlug: "n80",
      lineName: "N80",
      lineStopIds: ["68"],
    });
    expect(resolveLineSlug("C-30")).toEqual({
      canonicalSlug: "c30",
      lineName: "C30",
      lineStopIds: ["59"],
    });
    expect(resolveLineSlug("806")).toEqual({
      canonicalSlug: "806",
      lineName: "806",
      lineStopIds: ["335"],
    });
  });

  it("resolves a numeric slug to the line named after it, not to the line keyed by it", () => {
    // busLineData keys "1", "14" and "30" belong to C1, B1 and LB1, while the
    // lines actually *named* "1", "14" and "30" live under other keys
    expect(resolveLineSlug("1")).toEqual({
      canonicalSlug: "1",
      lineName: "1",
      lineStopIds: ["73", "129"],
    });
    expect(resolveLineSlug("14")).toEqual({
      canonicalSlug: "14",
      lineName: "14",
      lineStopIds: ["86"],
    });
    expect(resolveLineSlug("30")).toEqual({
      canonicalSlug: "30",
      lineName: "30",
      lineStopIds: ["384"],
    });
  });

  it("keeps the lines that own those keys on their own name slugs", () => {
    expect(resolveLineSlug("c1")?.lineStopIds).toContain("1");
    expect(resolveLineSlug("b1")?.lineStopIds).toContain("14");
    expect(resolveLineSlug("lb1")?.lineStopIds).toContain("30");
  });

  it("does not resolve a key that no line is named after", () => {
    // "444" is the key of "Línia V4.1" and no line is named "444"
    expect(busLineData["444"].name).toBe("Línia V4.1");
    expect(resolveLineSlug("444")).toBeNull();
  });

  it("returns null for unknown slugs", () => {
    expect(resolveLineSlug("99999")).toBeNull();
    expect(resolveLineSlug("not-a-line")).toBeNull();
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

describe("priority line slugs", () => {
  it("keeps all Search Console priority lines available while limiting mobile-visible links", () => {
    expect(getPriorityLineSlugs()).toContain("c18");
    expect(getPriorityLineSlugs()).toContain("806");
    expect(getVisiblePriorityLineSlugs()).toEqual(
      getPriorityLineSlugs().slice(0, 6),
    );
  });
});

describe("lineStopIdToSlug", () => {
  it("returns null for ids that are not in busLineData", () => {
    expect(lineStopIdToSlug("does-not-exist")).toBeNull();
  });
});

describe("buildLinePagePathFromName", () => {
  it("slugifies the line name before building the path", () => {
    expect(buildLinePagePathFromName("C-30")).toBe("/linea/c30");
    // Accents are stripped rather than transliterated: "Línia" -> "lnia"
    expect(buildLinePagePathFromName("Línia V4.1")).toBe("/linea/lniav4.1");
  });
});

describe("getLineOgImagePath", () => {
  it("still delegates to buildLineOgImagePath", () => {
    expect(getLineOgImagePath("N80")).toBe(buildLineOgImagePath("N80"));
  });
});

describe("getAllLineSlugs", () => {
  const slugs = getAllLineSlugs();

  it("includes both Search Console aliases and busLineData name slugs", () => {
    expect(slugs).toContain("n80");
    expect(slugs).toContain("806");
    expect(slugs).toContain("c1");
    expect(slugs).toContain("b1");
  });

  it("is sorted and free of duplicates", () => {
    expect(slugs).toEqual([...new Set(slugs)]);
    expect(slugs).toEqual([...slugs].sort());
  });

  it("lists a slug for every line name in busLineData", () => {
    for (const lineData of Object.values(busLineData)) {
      expect(slugs).toContain(lineNameToSlug(lineData.name));
    }
  });

  // The sitemap is built from this list, so every slug in it must be a page
  // that actually renders -- including the ones whose name collides with
  // another line's busLineData key.
  it("only emits slugs that resolve to a line", () => {
    expect(slugs).toContain("14");
    for (const slug of slugs) {
      expect(resolveLineSlug(slug)).not.toBeNull();
    }
  });
});

describe("getAllSeoLineEntries", () => {
  const entries = getAllSeoLineEntries();

  it("prefers the Search Console alias name over the raw busLineData name", () => {
    const n80 = entries.find((entry) => entry.slug === "n80");
    expect(n80).toEqual({ slug: "n80", name: "N80" });
    // busLineData calls the same line "N-80"
    expect(busLineData["68"].name).toBe("N-80");
    expect(entries.some((entry) => entry.name === "N-80")).toBe(false);
  });

  it("has exactly one entry per slug from getAllLineSlugs", () => {
    const slugs = entries.map((entry) => entry.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
    expect([...slugs].sort()).toEqual(getAllLineSlugs());
  });

  it("is sorted by name using Catalan collation", () => {
    const names = entries.map((entry) => entry.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "ca")));
  });
});

describe("getLineIdsBySlug", () => {
  it("returns the internal ids behind a public slug", () => {
    expect(getLineIdsBySlug("n80")).toEqual(["68"]);
    expect(getLineIdsBySlug("c1")).toEqual(["1"]);
  });

  it("returns an empty list for unknown slugs", () => {
    expect(getLineIdsBySlug("not-a-line")).toEqual([]);
  });
});

describe("getCanonicalLineName", () => {
  it("returns the canonical name for a slug", () => {
    expect(getCanonicalLineName("n80")).toBe("N80");
    expect(getCanonicalLineName("C-1")).toBe("C1");
  });

  it("returns null for unknown slugs", () => {
    expect(getCanonicalLineName("not-a-line")).toBeNull();
  });
});
