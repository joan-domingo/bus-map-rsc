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
    fillColor: "#4285F4",
    fillOpacity: 1.0,
    strokeColor: "#ffffff",
    strokeWeight: 4,
    scale: 12,
    animation: google.maps.Animation.BOUNCE,
    zIndex: 1000,
  };

  return <Marker position={location} icon={customIcon} />;
}
