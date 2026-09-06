import { describe, expect, it } from "bun:test";
import { buildLinePagePath, getAllLineSlugs } from "../../lib/utils/seo";
import sitemap from "../sitemap";

describe("sitemap", () => {
  const entries = sitemap();

  it("starts with the home page at top priority", () => {
    expect(entries[0]).toMatchObject({
      url: "https://quantriga.com",
      changeFrequency: "daily",
      priority: 1,
    });
  });

  it("lists the lines index just below the home page", () => {
    expect(entries[1]).toMatchObject({
      url: "https://quantriga.com/linies",
      changeFrequency: "daily",
      priority: 0.9,
    });
  });

  it("adds one daily 0.8-priority entry per line slug", () => {
    const lineEntries = entries.slice(2);

    expect(lineEntries.map((entry) => entry.url)).toEqual(
      getAllLineSlugs().map(
        (slug) => `https://quantriga.com${buildLinePagePath(slug)}`,
      ),
    );
    for (const entry of lineEntries) {
      expect(entry.changeFrequency).toBe("daily");
      expect(entry.priority).toBe(0.8);
    }
  });

  it("timestamps every entry", () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });

  it("has no duplicate URLs", () => {
    const urls = entries.map((entry) => entry.url);
    expect(urls).toEqual([...new Set(urls)]);
  });
});
