"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useMemo, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useStarredStops } from "../store/useStarredStops";
import type { BusStop } from "../types";
import { trackEvent } from "../utils/analytics";
import { Attribution } from "./Attribution";
import { FeedbackButton } from "./FeedbackButton";
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
    trackEvent("location_button_click", {
      current_zoom: zoom,
    });
    setIsDragging(false);
    setZoom(18);
  }, [zoom]);

  const handleFeedbackClick = useCallback(() => {
    trackEvent("feedback_button_click");
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
    const newValue = !showOnlyStarred;
    trackEvent("toggle_starred_filter", {
      show_only_starred: newValue,
      starred_stops_count: starredStopIdsArray.length,
    });
    setShowOnlyStarred(newValue);
  }, [showOnlyStarred, setShowOnlyStarred, starredStopIdsArray]);

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
        <FeedbackButton
          href="https://docs.google.com/forms/d/e/1FAIpQLSe1wNznFn_gFzqhmuFOTVYR_tyeNSbvVxDx_fWTY2L8T8EMnQ/viewform?usp=dialog"
          onClick={handleFeedbackClick}
        />
        <Attribution />
      </div>
    </APIProvider>
  );
}
