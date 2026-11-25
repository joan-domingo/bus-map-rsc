import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { BusStop } from "../../types";
import {
  createBusStopFeatureCollection,
  createBusStopMarkerElement,
  MapboxMap,
} from "../MapboxMap";

const busStops: BusStop[] = [
  {
    id: 1,
    name: "Parada 1",
    lat: 41.5,
    lon: 2.1,
    buses: ["53"],
    lineId: 53,
    zoneId: 3,
  },
  {
    id: 2,
    name: "Parada 2",
    lat: Number.NaN,
    lon: 2.2,
    buses: ["68"],
    lineId: 68,
    zoneId: 3,
  },
];

describe("createBusStopFeatureCollection", () => {
  it("keeps valid coordinates in longitude-latitude order and marks selection", () => {
    const collection = createBusStopFeatureCollection(busStops, 1);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]).toMatchObject({
      properties: {
        stopId: 1,
        name: "Parada 1",
        selected: true,
      },
      geometry: {
        type: "Point",
        coordinates: [2.1, 41.5],
      },
    });
  });
});

describe("createBusStopMarkerElement", () => {
  it("renders colored line badges and forwards marker clicks", () => {
    const onClick = mock();
    const marker = createBusStopMarkerElement(busStops[0], true, onClick);

    expect(marker.tagName).toBe("BUTTON");
    expect(marker.getAttribute("aria-label")).toContain("C10");
    expect(marker.textContent).toBe("C10");
    expect(marker.style.zIndex).toBe("1");

    marker.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("wraps multiple line badges into a compact grid", () => {
    const stop: BusStop = {
      id: 3,
      name: "Parada 3",
      lat: 41.5,
      lon: 2.1,
      buses: ["53", "68", "1", "2"],
      lineId: 53,
      zoneId: 3,
    };
    const marker = createBusStopMarkerElement(stop, false, () => {});
    const badgeRows = marker.querySelector(
      '[role="group"][aria-label="Línies de bus"]',
    );

    expect(badgeRows?.children).toHaveLength(2);
  });
});

describe("MapboxMap", () => {
  it("explains how to configure a token when one is missing", () => {
    render(
      <MapboxMap
        accessToken=""
        busStops={busStops}
        selectedStopId={null}
        userLocation={undefined}
        isDragging={false}
        zoom={15}
        onStopClick={() => {}}
        setIsDragging={() => {}}
        setZoom={() => {}}
        onMapError={() => {}}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Mapa interactiu de Mapbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN/),
    ).toBeInTheDocument();
  });
});
