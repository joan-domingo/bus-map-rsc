"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useMemo, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useStarredStops } from "../store/useStarredStops";
import type { BusStop } from "../types";
import { trackEvent } from "../utils/analytics";
import { Attribution } from "./Attribution";
import { Header } from "./Header";
import { LocationButton } from "./LocationButton";
import { BusMap } from "./Map";

interface MapContainerProps {
  allBusStops: BusStop[];
  lineFilter?: {
    lineStopIds: string[];
    lineName: string;
  };
  /**
   * CSS height of the map. Pages that render content below the map shrink it,
   * so part of that content shows without the map swallowing the touch that
   * would scroll to it.
   */
  mapHeight?: string;
}

export function MapContainer({
  allBusStops,
  lineFilter,
  mapHeight = "100dvh",
}: MapContainerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { location: userLocation, error: locationError } = useGeolocation();
  const starredStopIdsArray = useStarredStops(
    (state) => state.starredStopIdsArray,
  );
  const showOnlyStarred = useStarredStops((state) => state.showOnlyStarred);
  const setShowOnlyStarred = useStarredStops(
    (state) => state.setShowOnlyStarred,
  );

  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(15);
  const [isStopSelected, setIsStopSelected] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Memoize the starred set separately to avoid recreating it unnecessarily
  const starredSet = useMemo(
    () => new Set(starredStopIdsArray),
    [starredStopIdsArray],
  );

  const filteredBusStops = useMemo(() => {
    let stops = allBusStops;

    if (lineFilter) {
      const selectedLineStopIds = new Set(lineFilter.lineStopIds);
      stops = stops.filter((stop) =>
        stop.buses.some((lineStopId) => selectedLineStopIds.has(lineStopId)),
      );
    }

    if (showOnlyStarred) {
      stops = stops.filter((stop) => starredSet.has(stop.id));
    }

    return stops;
  }, [allBusStops, showOnlyStarred, starredSet, lineFilter]);

  const handleLocationButtonClick = useCallback(() => {
    trackEvent("location_button_click", {
      current_zoom: zoom,
    });
    setIsDragging(false);
    setZoom(18);
  }, [zoom]);

  const handleToggleStarred = useCallback(() => {
    const newValue = !showOnlyStarred;
    trackEvent("toggle_starred_filter", {
      show_only_starred: newValue,
      starred_stops_count: starredStopIdsArray.length,
    });
    setShowOnlyStarred(newValue);
  }, [showOnlyStarred, setShowOnlyStarred, starredStopIdsArray]);

  const handleMapError = useCallback((error: unknown) => {
    console.error("Google Maps failed to load:", error);
    setMapError(true);
  }, []);

  if (locationError) {
    // Show error if geolocation fails
    console.warn("Geolocation error:", locationError);
  }

  if (!apiKey) {
    return (
      <div
        className="w-screen flex items-center justify-center bg-red-100"
        style={{ height: "100dvh" }}
      >
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Google Maps API Key Required
          </h1>
          <p className="text-red-600">
            Please add your Google Maps API key to the .env.local file
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} language="ca" onError={handleMapError}>
      <div className="relative w-screen" style={{ height: mapHeight }}>
        <Header
          showOnlyStarred={showOnlyStarred}
          onToggleStarred={handleToggleStarred}
          highlightedLineName={lineFilter?.lineName}
        />
        <BusMap
          busStops={filteredBusStops}
          userLocation={userLocation ?? undefined}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          zoom={zoom}
          setZoom={setZoom}
          onStopSelectionChange={setIsStopSelected}
        />
        {mapError && (
          <div
            aria-live="assertive"
            className="absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 justify-center"
          >
            <span
              className="rounded bg-white/90 px-3 py-2 text-sm text-gray-700 shadow"
              role="alert"
            >
              No s'ha pogut carregar el mapa.
            </span>
          </div>
        )}
        <LocationButton
          onClick={handleLocationButtonClick}
          isDragging={isDragging}
          isStopSelected={isStopSelected}
        />
        <Attribution isStopSelected={isStopSelected} />
      </div>
    </APIProvider>
  );
}
