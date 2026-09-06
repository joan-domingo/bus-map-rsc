import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { FakeImageResponse } from "../../../test/nextOgMock";
import {
  buildOgImageAlt,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  OgImageContent,
  renderOgImage,
} from "../og-image";

describe("OG image constants", () => {
  it("uses the 1200x630 PNG card the metadata advertises", () => {
    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(OG_IMAGE_CONTENT_TYPE).toBe("image/png");
  });
});

describe("buildOgImageAlt", () => {
  it("includes line code for line variants", () => {
    expect(buildOgImageAlt("n80")).toBe(
      "Bus N80 Moventis en temps real · QuanTriga.com",
    );
  });

  it("describes the homepage for the default variant", () => {
    expect(buildOgImageAlt()).toContain("Moventis temps real");
  });

  it("treats null and an empty name as the homepage variant", () => {
    expect(buildOgImageAlt(null)).toBe(buildOgImageAlt());
    expect(buildOgImageAlt("")).toBe(buildOgImageAlt());
  });
});

describe("OgImageContent", () => {
  it("shows the site branding for the homepage variant", () => {
    const { container } = render(<OgImageContent />);

    const text = container.textContent ?? "";
    expect(text).toContain("Public Transit Tracker");
    expect(text).toContain("QuanTriga.com");
    expect(text).toContain("Temps Real Autobusos");
    expect(text).toContain("quantriga.com");
    expect(text).not.toContain("quantriga.com/linea/");
  });

  it("shows the uppercased line and its deep link for the line variant", () => {
    const { container } = render(<OgImageContent lineName="c-30" />);

    const text = container.textContent ?? "";
    expect(text).toContain("Línia Moventis");
    expect(text).toContain("Bus C-30 temps real");
    expect(text).toContain("Moventis · temps real");
    expect(text).toContain("de la línia C-30 actualitzats");
    // The footer uses the URL slug, not the raw name
    expect(text).toContain("quantriga.com/linea/c30");
  });

  it("uses a smaller headline for the longer line variant title", () => {
    const { container: home } = render(<OgImageContent />);
    const { container: line } = render(<OgImageContent lineName="n80" />);

    const headline = (root: HTMLElement, needle: string) =>
      [...root.querySelectorAll("div")].find(
        (node) => node.textContent === needle,
      );

    expect(headline(home, "QuanTriga.com")).toHaveStyle({ fontSize: "64px" });
    expect(headline(line, "Bus N80 temps real")).toHaveStyle({
      fontSize: "52px",
    });
  });
});

describe("renderOgImage", () => {
  it("renders the homepage card at the advertised size", () => {
    const response = renderOgImage() as unknown as FakeImageResponse;

    expect(response).toBeInstanceOf(FakeImageResponse);
    expect(response.options).toEqual({ width: 1200, height: 630 });
    const { container } = render(response.element as ReactElement);
    expect(container.textContent).toContain("QuanTriga.com");
  });

  it("renders the line card when given a line name", () => {
    const response = renderOgImage("n80") as unknown as FakeImageResponse;

    const { container } = render(response.element as ReactElement);
    expect(container.textContent).toContain("Bus N80 temps real");
  });

  it("treats a null line name as the homepage card", () => {
    const response = renderOgImage(null) as unknown as FakeImageResponse;

    const { container } = render(response.element as ReactElement);
    expect(container.textContent).toContain("Public Transit Tracker");
  });
});
