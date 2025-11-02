"use client";

import { Marker } from "@vis.gl/react-google-maps";
import type { UserLocation } from "../types";

interface UserLocationMarkerProps {
  location: UserLocation;
}

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  // Create a custom icon using SVG data URL
  const customIcon = {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#22c55e",
    fillOpacity: 0.8,
    strokeColor: "#ffffff",
    strokeWeight: 3,
    scale: 8,
    animation: google.maps.Animation.BOUNCE,
  };

  return <Marker position={location} icon={customIcon} />;
}
