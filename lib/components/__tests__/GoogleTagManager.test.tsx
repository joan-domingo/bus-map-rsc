import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { render, waitFor } from "@testing-library/react";
import { GoogleTagManager } from "../GoogleTagManager";

describe("GoogleTagManager", () => {
  let originalLocation: Location;

  beforeEach(() => {
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

  it("should not load GTM script on localhost", async () => {
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
        const scripts = document.head.querySelectorAll("script");
        expect(scripts.length).toBe(0);
        expect((window as any).dataLayer).toEqual([]);
      },
      { timeout: 100 },
    );
  });
});

