"use client";

import { useCallback, useMemo, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useStarredStops } from "../store/useStarredStops";
import type { BusStop } from "../types";
import { trackEvent } from "../utils/analytics";
import {
  type BusStopLineFilter,
  filterBusStops,
} from "../utils/filterBusStops";
import { Attribution } from "./Attribution";
import { Header } from "./Header";
import { LocationButton } from "./LocationButton";
import { BusMap } from "./Map";

interface MapContainerProps {
  allBusStops: BusStop[];
  lineFilter?: BusStopLineFilter;
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
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
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

  // Memoize the starred set separately to avoid recreating it unnecessarily
  const starredSet = useMemo(
    () => new Set(starredStopIdsArray),
    [starredStopIdsArray],
  );

  const filteredBusStops = useMemo(
    () => filterBusStops(allBusStops, lineFilter, showOnlyStarred, starredSet),
    [allBusStops, lineFilter, showOnlyStarred, starredSet],
  );

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
    console.error("Mapbox failed to load:", error);
  }, []);

  if (locationError) {
    // Show error if geolocation fails
    console.warn("Geolocation error:", locationError);
  }

  return (
    <div className="relative w-screen" style={{ height: mapHeight }}>
      <Header
        showOnlyStarred={showOnlyStarred}
        onToggleStarred={handleToggleStarred}
        highlightedLineName={lineFilter?.lineName}
      />
      <BusMap
        accessToken={accessToken}
        busStops={filteredBusStops}
        userLocation={userLocation ?? undefined}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        zoom={zoom}
        setZoom={setZoom}
        onStopSelectionChange={setIsStopSelected}
        onMapError={handleMapError}
      />
      <LocationButton
        onClick={handleLocationButtonClick}
        isDragging={isDragging}
        isStopSelected={isStopSelected}
      />
      <Attribution isStopSelected={isStopSelected} />
    </div>
  );
}
