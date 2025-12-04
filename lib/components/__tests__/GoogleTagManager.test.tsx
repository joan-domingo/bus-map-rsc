import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, waitFor } from "@testing-library/react";

// Mock next/script to avoid happy-dom error with external scripts
mock.module("next/script", () => ({
  default: (props: any) => {
    if (props.dangerouslySetInnerHTML) {
      return (
        <script
          id={props.id}
          dangerouslySetInnerHTML={props.dangerouslySetInnerHTML}
        />
      );
    }
    return null; // Ignore external scripts
  },
}));

describe("GoogleTagManager", () => {
  let originalLocation: Location;
  let GoogleTagManager: any;

  beforeEach(async () => {
    // Import component after mock
    const module = await import("../GoogleTagManager");
    GoogleTagManager = module.GoogleTagManager;

    // Store original location
    originalLocation = window.location;
    // Reset state
    document.head.innerHTML = "";
    (window as any).dataLayer = [];
  });

  afterEach(() => {
    // Cleanup
    document.head.innerHTML = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("should not load Google Analytics on localhost", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({
        hostname: "localhost",
        href: originalLocation.href,
        origin: originalLocation.origin,
        protocol: originalLocation.protocol,
        host: originalLocation.host,
        port: originalLocation.port,
        pathname: originalLocation.pathname,
        search: originalLocation.search,
        hash: originalLocation.hash,
      }),
    });

    render(<GoogleTagManager />);

    await waitFor(
      () => {
        // Should not initialize dataLayer on localhost
        const script = document.getElementById("google-analytics-init");
        expect(script).toBeNull();
        expect((window as any).dataLayer).toEqual([]);
      },
      { timeout: 1000 },
    );
  });

  it("should initialize Google Analytics on production", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      get: () => ({
        hostname: "quantriga.com",
        href: originalLocation.href,
        origin: originalLocation.origin,
        protocol: originalLocation.protocol,
        host: originalLocation.host,
        port: originalLocation.port,
        pathname: originalLocation.pathname,
        search: originalLocation.search,
        hash: originalLocation.hash,
      }),
    });

    render(<GoogleTagManager />);

    await waitFor(
      () => {
        // Check that script is injected
        const script = document.getElementById("google-analytics-init");
        expect(script).not.toBeNull();
        expect(script?.innerHTML).toContain("window.dataLayer = window.dataLayer || [];");
        expect(script?.innerHTML).toContain("function gtag(){dataLayer.push(arguments);}");
      },
      { timeout: 1000 },
    );
  });
});

