"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useMemo, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useStarredStops } from "../store/useStarredStops";
import type { BusStop } from "../types";
import { Attribution } from "./Attribution";
import { Header } from "./Header";
import { LocationButton } from "./LocationButton";
import { BusMap } from "./Map";

interface MapContainerProps {
  allBusStops: BusStop[];
}

export function MapContainer({ allBusStops }: MapContainerProps) {
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

  // Memoize the starred set separately to avoid recreating it unnecessarily
  const starredSet = useMemo(
    () => new Set(starredStopIdsArray),
    [starredStopIdsArray],
  );

  const filteredBusStops = useMemo(() => {
    if (!showOnlyStarred) {
      return allBusStops;
    }
    return allBusStops.filter((stop) => starredSet.has(stop.id));
  }, [allBusStops, showOnlyStarred, starredSet]);

  const handleLocationButtonClick = useCallback(() => {
    setIsDragging(false);
    setZoom(18);
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

  const handleToggleStarred = useCallback(() => {
    setShowOnlyStarred(!showOnlyStarred);
  }, [showOnlyStarred, setShowOnlyStarred]);

  return (
    <APIProvider apiKey={apiKey} language="ca">
      <div className="relative w-screen" style={{ height: "100dvh" }}>
        <Header
          showOnlyStarred={showOnlyStarred}
          onToggleStarred={handleToggleStarred}
        />
        <BusMap
          busStops={filteredBusStops}
          userLocation={userLocation ?? undefined}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          zoom={zoom}
          setZoom={setZoom}
        />
        <LocationButton
          onClick={handleLocationButtonClick}
          isDragging={isDragging}
        />
        <Attribution />
      </div>
    </APIProvider>
  );
}
