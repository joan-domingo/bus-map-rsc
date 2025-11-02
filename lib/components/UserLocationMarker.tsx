"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { UserLocation } from "../types";

interface UserLocationMarkerProps {
  location: UserLocation;
}

export function UserLocationMarker({ location }: UserLocationMarkerProps) {
  return (
    <AdvancedMarker position={location} zIndex={1000}>
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "#4285F4",
          border: "4px solid #ffffff",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      />
    </AdvancedMarker>
  );
}
