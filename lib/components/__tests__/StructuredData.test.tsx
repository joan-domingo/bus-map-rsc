import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { StructuredData } from "../StructuredData";

function readJsonLd(container: HTMLElement) {
  return [
    ...container.querySelectorAll('script[type="application/ld+json"]'),
  ].map((script) => JSON.parse(script.innerHTML));
}

describe("StructuredData", () => {
  it("emits the WebApplication, Organization and WebSite schemas", () => {
    const { container } = render(<StructuredData />);

    const schemas = readJsonLd(container);
    expect(schemas.map((schema) => schema["@type"])).toEqual([
      "WebApplication",
      "Organization",
      "WebSite",
    ]);
    for (const schema of schemas) {
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema.name).toBe("QuanTriga.com");
      expect(schema.url).toBe("https://quantriga.com");
    }
  });

  it("describes the app as a free transport application", () => {
    const { container } = render(<StructuredData />);

    const [webApplication] = readJsonLd(container);
    expect(webApplication.applicationCategory).toBe(
      "TransportationApplication",
    );
    expect(webApplication.offers).toEqual({
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    });
    expect(webApplication.inLanguage).toEqual(["ca", "es"]);
  });

  it("points the site search action at the lines index", () => {
    const { container } = render(<StructuredData />);

    const website = readJsonLd(container)[2];
    expect(website.potentialAction).toEqual({
      "@type": "SearchAction",
      target: "https://quantriga.com/linies",
    });
  });

  it("escapes < so the JSON-LD cannot close its own script tag", () => {
    const { container } = render(<StructuredData />);

    for (const script of container.querySelectorAll("script")) {
      expect(script.innerHTML).not.toContain("<");
    }
  });
});
