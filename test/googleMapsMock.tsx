import { mock } from "bun:test";
import type { ReactNode } from "react";

/**
 * Shared test double for @vis.gl/react-google-maps and the `google.maps`
 * global. Bun's module mocks are process-wide, so every test that renders a map
 * component imports this single mock and steers it through `mapsMock` instead
 * of registering its own competing mock of the same module.
 */
export interface FakeLatLngBoundsLiteral {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface MapsMockState {
  /** What `useMap()` returns; `null` mimics the map not being ready yet. */
  map: FakeMap | null;
  /** Props captured from the last render, keyed by component name. */
  props: Record<string, Record<string, unknown>>;
}

export const mapsMock: MapsMockState = {
  map: null,
  props: {},
};

export function resetMapsMock() {
  mapsMock.map = null;
  mapsMock.props = {};
}

class FakeLatLng {
  constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}
  lat() {
    return this.latitude;
  }
  lng() {
    return this.longitude;
  }
}

class FakeLatLngBounds {
  constructor(
    private readonly sw: FakeLatLng,
    private readonly ne: FakeLatLng,
  ) {}
  getSouthWest() {
    return this.sw;
  }
  getNorthEast() {
    return this.ne;
  }
  getCenter() {
    return new FakeLatLng(
      (this.sw.lat() + this.ne.lat()) / 2,
      (this.sw.lng() + this.ne.lng()) / 2,
    );
  }
  contains(position: FakeLatLng) {
    return (
      position.lat() >= this.sw.lat() &&
      position.lat() <= this.ne.lat() &&
      position.lng() >= this.sw.lng() &&
      position.lng() <= this.ne.lng()
    );
  }
}

export class FakeMap {
  bounds: FakeLatLngBounds | undefined;
  zoom: number | undefined;
  readonly listeners = new Map<string, Set<() => void>>();

  constructor(bounds?: FakeLatLngBoundsLiteral, zoom = 15) {
    this.setBounds(bounds);
    this.zoom = zoom;
  }

  setBounds(bounds?: FakeLatLngBoundsLiteral) {
    this.bounds = bounds
      ? new FakeLatLngBounds(
          new FakeLatLng(bounds.south, bounds.west),
          new FakeLatLng(bounds.north, bounds.east),
        )
      : undefined;
  }

  getBounds() {
    return this.bounds;
  }

  getZoom() {
    return this.zoom;
  }

  addListener(eventName: string, handler: () => void) {
    const handlers = this.listeners.get(eventName) ?? new Set();
    handlers.add(handler);
    this.listeners.set(eventName, handlers);
    return {
      remove: () => {
        handlers.delete(handler);
      },
    };
  }

  /** Fires every handler registered for an event, as the real map would. */
  emit(eventName: string) {
    for (const handler of this.listeners.get(eventName) ?? []) {
      handler();
    }
  }

  listenerCount() {
    let total = 0;
    for (const handlers of this.listeners.values()) {
      total += handlers.size;
    }
    return total;
  }
}

// biome-ignore lint/suspicious/noExplicitAny: the global stands in for the Maps JS SDK
(globalThis as any).google = {
  maps: {
    LatLng: FakeLatLng,
    LatLngBounds: FakeLatLngBounds,
  },
};

function capture(name: string, props: Record<string, unknown>) {
  mapsMock.props[name] = props;
}

mock.module("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children, ...props }: { children?: ReactNode }) => {
    capture("APIProvider", props);
    return <div data-testid="api-provider">{children}</div>;
  },
  Map: ({ children, ...props }: { children?: ReactNode }) => {
    capture("Map", props);
    return <div data-testid="google-map">{children}</div>;
  },
  AdvancedMarker: ({
    children,
    onClick,
    ...props
  }: {
    children?: ReactNode;
    onClick?: () => void;
  }) => {
    capture("AdvancedMarker", props);
    return (
      <button type="button" data-testid="advanced-marker" onClick={onClick}>
        {children}
      </button>
    );
  },
  InfoWindow: ({
    children,
    headerContent,
    ...props
  }: {
    children?: ReactNode;
    headerContent?: ReactNode;
  }) => {
    capture("InfoWindow", props);
    return (
      <div data-testid="info-window">
        {headerContent}
        {children}
      </div>
    );
  },
  useAdvancedMarkerRef: () => [() => {}, { id: "marker" }],
  useMap: () => mapsMock.map,
}));
