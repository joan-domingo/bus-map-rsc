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
        expect((window as any).dataLayer).toEqual([]);
        expect((window as any).gtag).toBeUndefined();
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
        // Check that dataLayer is initialized
        expect((window as any).dataLayer).toBeDefined();
        expect(Array.isArray((window as any).dataLayer)).toBe(true);
        // Check that gtag function exists
        expect(typeof (window as any).gtag).toBe("function");
      },
      { timeout: 1000 },
    );
  });
});

