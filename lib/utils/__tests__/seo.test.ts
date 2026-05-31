import { buildHomePageSeo, buildLinePageSeo } from "../seo";

describe("buildLinePageSeo", () => {
  it("leads with bus line code and bilingual real-time keywords", () => {
    const seo = buildLinePageSeo("n80");
    expect(seo.title).toBe("Bus N80 temps real · Moventis");
    expect(seo.description).toContain("N80");
    expect(seo.description).toContain("tiempo real");
    expect(seo.description).toContain("bus N80");
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
