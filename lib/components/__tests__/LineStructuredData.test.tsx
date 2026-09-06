import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { LineStructuredData } from "../LineStructuredData";

function readJsonLd(container: HTMLElement) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return JSON.parse(script?.innerHTML ?? "null");
}

describe("LineStructuredData", () => {
  it("uppercases the line name throughout the WebPage schema", () => {
    const { container } = render(
      <LineStructuredData lineName="n80" path="/linea/n80" />,
    );

    const webPage = readJsonLd(container);
    expect(webPage["@type"]).toBe("WebPage");
    expect(webPage.name).toBe("Bus N80 Moventis en temps real");
    expect(webPage.url).toBe("https://quantriga.com/linea/n80");
    expect(webPage.keywords).toContain("N80 temps real");
    expect(webPage.about.name).toBe("Moventis línia N80");
    expect(webPage.about.provider.name).toBe("Moventis");
  });

  it("builds an Inici → Línies → line breadcrumb", () => {
    const { container } = render(
      <LineStructuredData lineName="C30" path="/linea/c30" />,
    );

    const { breadcrumb } = readJsonLd(container);
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(
      breadcrumb.itemListElement.map(
        (item: { position: number; name: string; item: string }) => [
          item.position,
          item.name,
          item.item,
        ],
      ),
    ).toEqual([
      [1, "Inici", "https://quantriga.com"],
      [2, "Línies", "https://quantriga.com/linies"],
      [3, "C30", "https://quantriga.com/linea/c30"],
    ]);
  });

  it("escapes < so the JSON-LD cannot close its own script tag", () => {
    const { container } = render(
      <LineStructuredData lineName="<script>" path="/linea/x" />,
    );

    expect(container.querySelector("script")?.innerHTML).not.toContain("<");
  });
});
