import { describe, expect, it } from "bun:test";
import RootLayout, { metadata, viewport } from "../layout";

describe("root metadata", () => {
  it("is based at the production origin", () => {
    expect(metadata.metadataBase).toEqual(new URL("https://quantriga.com"));
    expect(metadata.alternates?.canonical).toBe("https://quantriga.com");
  });

  it("templates child titles under the site name", () => {
    expect(metadata.title).toEqual({
      default: "Moventis temps real| QuanTriga.com",
      template: "%s | QuanTriga.com",
    });
  });

  it("lets search engines index and follow everything", () => {
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    });
  });

  it("covers the priority lines and the served towns in its keywords", () => {
    const keywords = metadata.keywords as string[];

    for (const keyword of ["n80", "c30", "c18", "806", "moventis temps real"]) {
      expect(keywords).toContain(keyword);
    }
    for (const town of ["cerdanyola", "sabadell", "terrassa", "barcelona"]) {
      expect(keywords).toContain(town);
    }
  });

  it("shares the same OG and Twitter card image", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "ca_ES",
      url: "https://quantriga.com",
      images: [
        {
          url: "/og-image",
          width: 1200,
          height: 630,
          alt: "QuanTriga.com - Mapa de temps real d'autobusos",
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/og-image"],
    });
  });

  it("declares itself an installable Catalan web app", () => {
    expect(metadata.manifest).toBe("/manifest.json");
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      statusBarStyle: "black-translucent",
      title: "QuanTriga",
    });
  });
});

describe("viewport", () => {
  it("fits the display cutout and allows pinch zoom up to 5x", () => {
    expect(viewport).toMatchObject({
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
      viewportFit: "cover",
    });
  });

  it("themes the browser chrome for light and dark", () => {
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "#088b9f" },
      { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ]);
  });
});

describe("RootLayout", () => {
  // <html>/<body> cannot be mounted inside the test document, so the element
  // tree is inspected directly instead of being rendered.
  function layoutTree() {
    return RootLayout({ children: <main>contingut</main> });
  }

  it("declares the document language as Catalan", () => {
    expect(layoutTree().props.lang).toBe("ca");
  });

  it("applies both font variables and antialiasing to the body", () => {
    const body = layoutTree().props.children;

    expect(body.type).toBe("body");
    expect(body.props.className).toBe(
      "--font-geist-sans --font-geist-mono antialiased",
    );
  });

  it("mounts analytics and structured data ahead of the page content", () => {
    const [analytics, structuredData, children] =
      layoutTree().props.children.props.children;

    expect(analytics.type.name).toBe("GoogleTagManager");
    expect(structuredData.type.name).toBe("StructuredData");
    expect(children.type).toBe("main");
  });
});
