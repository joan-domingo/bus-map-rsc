import { buildOgImageAlt } from "../og-image";

describe("buildOgImageAlt", () => {
  it("includes line code for line variants", () => {
    expect(buildOgImageAlt("n80")).toBe(
      "Bus N80 Moventis en temps real · QuanTriga.com",
    );
  });

  it("describes the homepage for the default variant", () => {
    expect(buildOgImageAlt()).toContain("Moventis temps real");
  });
});
