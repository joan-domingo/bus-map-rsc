"use client";

import { Marker } from "@vis.gl/react-google-maps";
import type { UserLocation } from "../types";

interface UserLocationMarkerProps {
  location: UserLocation;
}

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <Marker position={location}>
      <div className="w-6 h-6 bg-green-600 rounded-full border-2 border-white shadow-lg">
        <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
      </div>
    </Marker>
  );
}
