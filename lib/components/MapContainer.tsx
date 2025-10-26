"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useGeolocation } from "../hooks/useGeolocation";
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

  if (locationError) {
    // Show error if geolocation fails
    console.warn("Geolocation error:", locationError);
  }

  if (!apiKey) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-red-100">
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
    <APIProvider apiKey={apiKey} language="ca">
      <div className="relative h-screen w-screen">
        <Header />
        <BusMap
          busStops={allBusStops}
          userLocation={userLocation ?? undefined}
        />
        <LocationButton />
        <Attribution />
      </div>
    </APIProvider>
  );
}
