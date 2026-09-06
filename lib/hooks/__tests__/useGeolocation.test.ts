import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useGeolocation } from "../useGeolocation";

describe("useGeolocation", () => {
  let mockGeolocation: {
    getCurrentPosition: ReturnType<typeof mock>;
    watchPosition: ReturnType<typeof mock>;
    clearWatch: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();

    // Create fresh mocks for each test
    mockGeolocation = {
      getCurrentPosition: mock(),
      watchPosition: mock(),
      clearWatch: mock(),
    };

    // Mock navigator.geolocation
    Object.defineProperty(navigator, "geolocation", {
      writable: true,
      value: mockGeolocation,
    });
  });

  afterEach(() => {
    // Bun's mocks are automatically cleaned up
    localStorage.clear();
  });

  it("should return default location when geolocation is not supported", () => {
    Object.defineProperty(navigator, "geolocation", {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toEqual({
      lat: 41.4912314,
      lng: 2.1403111,
    });
    expect(result.current.error).toBe(
      "Geolocation is not supported by this browser",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("should return default location initially", () => {
    // Don't call the mock - just let it be undefined so it uses default
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toEqual({
      lat: 41.4912314,
      lng: 2.1403111,
    });
  });

  it("should update location on successful geolocation", async () => {
    const mockPosition = {
      coords: {
        latitude: 41.5,
        longitude: 2.15,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition = mock((success) => {
      setTimeout(() => success(mockPosition), 10);
    });
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(
      () => {
        expect(result.current.location).toEqual({
          lat: 41.5,
          lng: 2.15,
        });
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );
  });

  it("should handle permission denied error", async () => {
    const mockError = {
      code: 1,
      message: "User denied geolocation",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition = mock((_, error) => {
      setTimeout(() => error(mockError), 10);
    });
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(
      () => {
        expect(result.current.error).toBe("Location access denied by user");
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );
  });

  it("should handle position unavailable error", async () => {
    const mockError = {
      code: 2,
      message: "Position unavailable",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition = mock((_, error) => {
      setTimeout(() => error(mockError), 10);
    });
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(
      () => {
        expect(result.current.error).toBe("Location information unavailable");
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );
  });

  it("should handle timeout error", async () => {
    const mockError = {
      code: 3,
      message: "Timeout",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    mockGeolocation.getCurrentPosition = mock((_, error) => {
      setTimeout(() => error(mockError), 10);
    });
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(
      () => {
        expect(result.current.error).toBe("Location request timed out");
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 1000 },
    );
  });

  it("should save location to localStorage on success", async () => {
    const mockPosition = {
      coords: {
        latitude: 41.5,
        longitude: 2.15,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition = mock((success) => {
      setTimeout(() => success(mockPosition), 10);
    });
    mockGeolocation.watchPosition = mock(() => 1);

    renderHook(() => useGeolocation());

    await waitFor(
      () => {
        const cached = localStorage.getItem("bus-map-last-location");
        expect(cached).toBeTruthy();
        if (cached) {
          const parsed = JSON.parse(cached);
          expect(parsed.lat).toBe(41.5);
          expect(parsed.lng).toBe(2.15);
          expect(parsed.timestamp).toBeDefined();
        }
      },
      { timeout: 1000 },
    );
  });

  it("should load cached location if available and not expired", () => {
    const cachedLocation = {
      lat: 41.6,
      lng: 2.2,
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    };
    localStorage.setItem(
      "bus-map-last-location",
      JSON.stringify(cachedLocation),
    );

    mockGeolocation.getCurrentPosition = mock(() => {});
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toEqual({
      lat: 41.6,
      lng: 2.2,
    });
  });

  it("should not use expired cached location", () => {
    const expiredCache = {
      lat: 41.6,
      lng: 2.2,
      timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    };
    localStorage.setItem("bus-map-last-location", JSON.stringify(expiredCache));

    mockGeolocation.getCurrentPosition = mock(() => {});
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toEqual({
      lat: 41.4912314,
      lng: 2.1403111,
    });
    expect(localStorage.getItem("bus-map-last-location")).toBeNull();
  });

  it("should ignore cached coordinates that are not finite numbers", () => {
    localStorage.setItem(
      "bus-map-last-location",
      JSON.stringify({ lat: "north", lng: 2.2, timestamp: Date.now() }),
    );
    mockGeolocation.getCurrentPosition = mock(() => {});
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toEqual({
      lat: 41.4912314,
      lng: 2.1403111,
    });
    expect(localStorage.getItem("bus-map-last-location")).toBeNull();
  });

  it("should discard and warn about unparseable cached data", () => {
    localStorage.setItem("bus-map-last-location", "{ not json");
    mockGeolocation.getCurrentPosition = mock(() => {});
    mockGeolocation.watchPosition = mock(() => 1);
    const warnings: unknown[][] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args);

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toEqual({
      lat: 41.4912314,
      lng: 2.1403111,
    });
    expect(localStorage.getItem("bus-map-last-location")).toBeNull();
    expect(warnings[0]?.[0]).toBe("Failed to load cached location:");
    console.warn = originalWarn;
  });

  it("should keep working when the cache cannot be written", async () => {
    // happy-dom's Storage is a proxy, so the whole object is swapped out
    const realStorage = localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        removeItem: () => {},
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    });
    const warnings: unknown[][] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args);
    mockGeolocation.getCurrentPosition = mock((success) => {
      success({
        coords: { latitude: 41.5, longitude: 2.15 },
        timestamp: Date.now(),
      });
    });
    mockGeolocation.watchPosition = mock(() => 1);

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.location).toEqual({ lat: 41.5, lng: 2.15 });
    });
    expect(warnings[0]?.[0]).toBe("Failed to save cached location:");

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: realStorage,
    });
    console.warn = originalWarn;
  });

  it("should skip the location cache when rendered on the server", () => {
    localStorage.setItem(
      "bus-map-last-location",
      JSON.stringify({ lat: 41.6, lng: 2.2, timestamp: Date.now() }),
    );
    const realWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });

    function Probe() {
      const { location, isLoading } = useGeolocation();
      return createElement(
        "div",
        null,
        `${location.lat},${location.lng},${isLoading}`,
      );
    }

    try {
      // Without window there is no localStorage to read, so the server always
      // renders the default location while still loading
      expect(renderToStaticMarkup(createElement(Probe))).toBe(
        "<div>41.4912314,2.1403111,true</div>",
      );
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: realWindow,
      });
    }
  });

  it("should clear watch on unmount", () => {
    const watchId = 123;
    mockGeolocation.watchPosition = mock(() => watchId);
    mockGeolocation.getCurrentPosition = mock(() => {});

    const { unmount } = renderHook(() => useGeolocation());

    unmount();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });
});
