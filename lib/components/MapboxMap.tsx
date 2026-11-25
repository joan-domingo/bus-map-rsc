"use client";

import type { Map as MapboxGLMap, Marker as MapboxGLMarker } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import type { BusStop, UserLocation } from "../types";
import {
  getLineStopBadgeLabel,
  getLineStopColor,
  getLineStopTextColor,
} from "../utils/seo";

interface MapboxMapProps {
  accessToken?: string;
  busStops: BusStop[];
  selectedStopId: number | null;
  userLocation: UserLocation | undefined;
  isDragging: boolean;
  zoom: number;
  onStopClick: (stop: BusStop) => void;
  setIsDragging: (isDragging: boolean) => void;
  setZoom: (zoom: number) => void;
  onMapError: (error: unknown) => void;
}

type MapStatus = "loading" | "ready" | "error";

export function createBusStopFeatureCollection(
  busStops: BusStop[],
  selectedStopId: number | null,
) {
  const features = [];

  for (const stop of busStops) {
    const latitude = Number(stop.lat);
    const longitude = Number(stop.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    features.push({
      type: "Feature" as const,
      properties: {
        stopId: stop.id,
        name: stop.name,
        selected: stop.id === selectedStopId,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [longitude, latitude] as [number, number],
      },
    });
  }

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

export function createBusStopMarkerElement(
  stop: BusStop,
  selected: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const marker = document.createElement("button");
  const columns = Math.max(1, Math.ceil(Math.sqrt(stop.buses.length)));
  const lineLabels = stop.buses.map(getLineStopBadgeLabel);

  marker.type = "button";
  marker.title = stop.name;
  marker.setAttribute(
    "aria-label",
    lineLabels.length > 0
      ? `${stop.name}, ${lineLabels.join(", ")}`
      : stop.name,
  );
  marker.style.display = "flex";
  marker.style.flexDirection = "column";
  marker.style.alignItems = "center";
  marker.style.padding = "0";
  marker.style.border = "0";
  marker.style.background = "transparent";
  marker.style.cursor = "pointer";
  marker.style.zIndex = selected ? "1" : "0";

  const content = document.createElement("span");
  content.style.position = "relative";
  content.style.display = "flex";
  content.style.flexDirection = "column";
  content.style.alignItems = "center";

  const badgeContainer = document.createElement("div");
  badgeContainer.style.display = "flex";
  badgeContainer.style.flexDirection = "row";
  badgeContainer.style.gap = "2px";
  badgeContainer.style.borderRadius = "8px";
  badgeContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  badgeContainer.style.padding = "2px";

  const badgeColumn = document.createElement("div");
  badgeColumn.setAttribute("role", "group");
  badgeColumn.setAttribute("aria-label", "Línies de bus");
  badgeColumn.style.display = "flex";
  badgeColumn.style.flexDirection = "column";
  badgeColumn.style.gap = "2px";

  for (let index = 0; index < stop.buses.length; index += columns) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "center";
    row.style.gap = "2px";

    for (const lineStopId of stop.buses.slice(index, index + columns)) {
      const label = getLineStopBadgeLabel(lineStopId);
      const badge = document.createElement("span");
      badge.textContent = label;
      badge.style.display = "inline-flex";
      badge.style.height = "24px";
      badge.style.minWidth = "24px";
      badge.style.alignItems = "center";
      badge.style.justifyContent = "center";
      badge.style.padding = "0 4px";
      badge.style.borderRadius = "6px";
      badge.style.color = getLineStopTextColor(lineStopId);
      badge.style.backgroundColor = getLineStopColor(lineStopId);
      badge.style.fontWeight = "600";
      badge.style.fontSize =
        label.length <= 3 ? "12px" : label.length <= 5 ? "10px" : "9px";
      row.append(badge);
    }

    badgeColumn.append(row);
  }

  badgeContainer.append(badgeColumn);

  const pointer = document.createElement("span");
  pointer.setAttribute("aria-hidden", "true");
  pointer.style.position = "absolute";
  pointer.style.top = "100%";
  pointer.style.left = "50%";
  pointer.style.width = "0";
  pointer.style.height = "0";
  pointer.style.transform = "translateX(-50%)";
  pointer.style.borderLeft = "8px solid transparent";
  pointer.style.borderRight = "8px solid transparent";
  pointer.style.borderTop = "12px solid rgba(0, 0, 0, 0.7)";

  content.append(badgeContainer, pointer);
  marker.append(content);
  marker.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });

  return marker;
}

function createUserLocationFeatureCollection(
  userLocation: UserLocation | undefined,
) {
  if (
    !userLocation ||
    !Number.isFinite(userLocation.lat) ||
    !Number.isFinite(userLocation.lng)
  ) {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  }

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: [userLocation.lng, userLocation.lat] as [number, number],
        },
      },
    ],
  };
}

export function MapboxMap({
  accessToken,
  busStops,
  selectedStopId,
  userLocation,
  isDragging,
  zoom,
  onStopClick,
  setIsDragging,
  setZoom,
  onMapError,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxGLMap | null>(null);
  const updateStopMarkersRef = useRef<(() => void) | null>(null);
  const currentPropsRef = useRef({
    busStops,
    selectedStopId,
    userLocation,
    isDragging,
    zoom,
    onStopClick,
    setIsDragging,
    setZoom,
    onMapError,
  });
  const [status, setStatus] = useState<MapStatus>(
    accessToken ? "loading" : "error",
  );

  currentPropsRef.current = {
    busStops,
    selectedStopId,
    userLocation,
    isDragging,
    zoom,
    onStopClick,
    setIsDragging,
    setZoom,
    onMapError,
  };

  useEffect(() => {
    const container = mapContainerRef.current;

    if (!accessToken || !container) {
      return;
    }

    let active = true;
    let hasLoaded = false;
    let map: MapboxGLMap | undefined;
    const stopMarkers = new Map<
      number,
      { marker: MapboxGLMarker; signature: string }
    >();

    const reportError = (error: unknown) => {
      console.error("Mapbox failed to load:", error);
      currentPropsRef.current.onMapError(error);
      if (active) {
        setStatus("error");
      }
    };

    const initializeMap = async () => {
      try {
        const { default: mapboxgl } = await import("mapbox-gl");

        if (!active) {
          return;
        }

        mapboxgl.accessToken = accessToken;
        const initialLocation = currentPropsRef.current.userLocation;
        map = new mapboxgl.Map({
          container,
          style: "mapbox://styles/mapbox/streets-v12",
          center: initialLocation
            ? [initialLocation.lng, initialLocation.lat]
            : [2.1403111, 41.4912314],
          zoom: currentPropsRef.current.zoom,
          attributionControl: false,
        });
        mapRef.current = map;

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false, showZoom: false }),
          "top-right",
        );

        const updateStopMarkers = () => {
          if (!map || !active) {
            return;
          }

          if (!map.getLayer("bus-stops-unclustered")) {
            return;
          }

          let visibleStops: BusStop[] = [];

          const bounds = map.getBounds();

          if (bounds) {
            const northEast = bounds.getNorthEast();
            const southWest = bounds.getSouthWest();
            const latitudeSpan = Math.max(
              northEast.lat - southWest.lat,
              0.000001,
            );
            const longitudeSpan = Math.max(
              northEast.lng - southWest.lng,
              0.000001,
            );
            const expandedBounds = new mapboxgl.LngLatBounds(
              [
                southWest.lng - longitudeSpan * 0.2,
                southWest.lat - latitudeSpan * 0.2,
              ],
              [
                northEast.lng + longitudeSpan * 0.2,
                northEast.lat + latitudeSpan * 0.2,
              ],
            );
            const unclusteredStopIds = new Set<number>();
            for (const feature of map.querySourceFeatures("bus-stops")) {
              const properties = feature.toJSON().properties;
              if (properties?.cluster) {
                continue;
              }

              const stopId = Number(properties?.stopId);
              if (Number.isFinite(stopId)) {
                unclusteredStopIds.add(stopId);
              }
            }
            const stopsInViewport = currentPropsRef.current.busStops.filter(
              (stop) =>
                unclusteredStopIds.has(stop.id) &&
                Number.isFinite(stop.lat) &&
                Number.isFinite(stop.lon) &&
                expandedBounds.contains([stop.lon, stop.lat]),
            );
            visibleStops = stopsInViewport;

            const selectedStop = currentPropsRef.current.busStops.find(
              (stop) =>
                stop.id === currentPropsRef.current.selectedStopId &&
                Number.isFinite(stop.lat) &&
                Number.isFinite(stop.lon),
            );

            if (
              selectedStop &&
              !visibleStops.some((stop) => stop.id === selectedStop.id)
            ) {
              visibleStops = [selectedStop, ...visibleStops];
            }
          }

          const visibleStopIds = new Set(visibleStops.map((stop) => stop.id));

          for (const [stopId, entry] of stopMarkers) {
            if (!visibleStopIds.has(stopId)) {
              entry.marker.remove();
              stopMarkers.delete(stopId);
            }
          }

          for (const stop of visibleStops) {
            const position: [number, number] = [stop.lon, stop.lat];
            const signature = [
              stop.name,
              stop.lat,
              stop.lon,
              stop.buses.join(","),
            ].join("|");
            const existingEntry = stopMarkers.get(stop.id);

            if (existingEntry?.signature === signature) {
              existingEntry.marker.setLngLat(position);
              existingEntry.marker.getElement().style.zIndex =
                stop.id === currentPropsRef.current.selectedStopId ? "1" : "0";
              continue;
            }

            existingEntry?.marker.remove();
            const element = createBusStopMarkerElement(
              stop,
              stop.id === currentPropsRef.current.selectedStopId,
              () => {
                const currentStop = currentPropsRef.current.busStops.find(
                  (candidate) => candidate.id === stop.id,
                );
                if (currentStop) {
                  currentPropsRef.current.onStopClick(currentStop);
                }
              },
            );
            const marker = new mapboxgl.Marker({
              element,
              anchor: "bottom",
            })
              .setLngLat(position)
              .addTo(map);

            stopMarkers.set(stop.id, { marker, signature });
          }
        };

        updateStopMarkersRef.current = updateStopMarkers;

        map.on("load", () => {
          if (!active || !map) {
            return;
          }

          map.addSource("bus-stops", {
            type: "geojson",
            data: createBusStopFeatureCollection(
              currentPropsRef.current.busStops,
              currentPropsRef.current.selectedStopId,
            ),
            cluster: true,
            clusterMaxZoom: 13,
            clusterRadius: 40,
          });

          map.addLayer({
            id: "bus-stop-clusters",
            type: "circle",
            source: "bus-stops",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "#4338ca",
              "circle-radius": 18,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.addLayer({
            id: "bus-stop-cluster-count",
            type: "symbol",
            source: "bus-stops",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 12,
            },
            paint: {
              "text-color": "#ffffff",
            },
          });

          map.addLayer({
            id: "bus-stops-unclustered",
            type: "circle",
            source: "bus-stops",
            filter: ["!", ["has", "point_count"]],
            layout: {
              visibility: "none",
            },
            paint: {
              "circle-color": [
                "case",
                ["get", "selected"],
                "#d97706",
                "#087f8c",
              ],
              "circle-radius": ["case", ["get", "selected"], 9, 6],
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.addSource("user-location", {
            type: "geojson",
            data: createUserLocationFeatureCollection(
              currentPropsRef.current.userLocation,
            ),
          });

          map.addLayer({
            id: "user-location",
            type: "circle",
            source: "user-location",
            paint: {
              "circle-color": "#4285f4",
              "circle-radius": 9,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 3,
            },
          });

          hasLoaded = true;
          setStatus("ready");
          map.once("idle", updateStopMarkers);
        });

        map.on("click", "bus-stop-clusters", (event) => {
          if (!map) {
            return;
          }

          map.easeTo({
            center: event.lngLat,
            zoom: Math.min(map.getZoom() + 2, 16),
          });
        });

        map.on("mouseenter", "bus-stop-clusters", () => {
          if (map) {
            map.getCanvas().style.cursor = "pointer";
          }
        });

        map.on("mouseleave", "bus-stop-clusters", () => {
          if (map) {
            map.getCanvas().style.cursor = "";
          }
        });

        map.on("dragstart", () => {
          currentPropsRef.current.setIsDragging(true);
        });

        map.on("zoomend", () => {
          if (map) {
            currentPropsRef.current.setZoom(map.getZoom());
            map.once("idle", updateStopMarkers);
          }
        });

        map.on("moveend", () => {
          map?.once("idle", updateStopMarkers);
        });

        map.on("error", (event) => {
          if (!hasLoaded) {
            reportError(event.error);
          }
        });
      } catch (error) {
        if (active) {
          reportError(error);
        }
      }
    };

    void initializeMap();

    return () => {
      active = false;
      updateStopMarkersRef.current = null;
      for (const entry of stopMarkers.values()) {
        entry.marker.remove();
      }
      map?.remove();
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [accessToken]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const source = mapRef.current?.getSource("bus-stops");
    if (source?.type === "geojson") {
      source.setData(createBusStopFeatureCollection(busStops, selectedStopId));
    }
    mapRef.current?.once("idle", () => updateStopMarkersRef.current?.());
  }, [busStops, selectedStopId, status]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const source = mapRef.current?.getSource("user-location");
    if (source?.type === "geojson") {
      source.setData(createUserLocationFeatureCollection(userLocation));
    }
  }, [status, userLocation]);

  useEffect(() => {
    const map = mapRef.current;

    if (status !== "ready" || !map) {
      return;
    }

    const camera: {
      center?: [number, number];
      duration: number;
      zoom?: number;
    } = { duration: 300 };

    if (!isDragging && userLocation) {
      camera.center = [userLocation.lng, userLocation.lat];
    }

    if (Math.abs(map.getZoom() - zoom) > 0.01) {
      camera.zoom = zoom;
    }

    if (camera.center || camera.zoom !== undefined) {
      map.easeTo(camera);
    }
  }, [isDragging, status, userLocation, zoom]);

  if (!accessToken) {
    return (
      <section
        aria-label="Mapa interactiu de Mapbox"
        className="flex h-full w-full items-center justify-center bg-slate-100 p-6 text-slate-900"
      >
        <output
          aria-label="Configuració del token de Mapbox"
          className="max-w-md rounded-xl bg-white p-6 shadow"
        >
          <span className="block text-lg font-semibold">
            Mapbox needs a public token
          </span>
          <span className="mt-2 block text-sm text-slate-600">
            Add <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to{" "}
            <code>.env.local</code>, then restart the dev server.
          </span>
        </output>
      </section>
    );
  }

  return (
    <div className="relative h-full w-full">
      <section
        ref={mapContainerRef}
        aria-label="Mapa interactiu de Mapbox"
        className="h-full w-full"
      />
      {status === "loading" && (
        <output
          aria-live="polite"
          className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-sm text-slate-700 shadow"
        >
          S'està carregant el mapa…
        </output>
      )}
      {status === "error" && (
        <p
          className="absolute bottom-4 left-4 rounded-md bg-white px-3 py-2 text-sm text-red-700 shadow"
          role="alert"
        >
          No s'ha pogut carregar Mapbox. Comprova el token i els dominis
          autoritzats.
        </p>
      )}
    </div>
  );
}
