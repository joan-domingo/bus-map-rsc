"use client";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useState } from "react";
import { useBusStopSelection } from "../hooks/useBusStopSelection";
import type { BusStop, UserLocation } from "../types";
import { BusStopCustomMarkers } from "./BusStopCustomMarker";
import { UserLocationMarker } from "./UserLocationMarker";

interface MapProps {
  busStops: BusStop[];
  userLocation: UserLocation | undefined;
}

export function BusMap({ busStops, userLocation }: MapProps) {
  const { selectedStopId, selectStop, clearSelection } = useBusStopSelection();
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(15);

  return (
    <div className="h-full w-full">
      <GoogleMap
        style={{ width: "100%", height: "100%" }}
        defaultCenter={userLocation}
        center={isDragging ? undefined : userLocation}
        defaultZoom={15}
        zoom={zoom}
        onZoomChanged={(event) => setZoom(event.detail.zoom)}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        mapId="public-transport-map"
        onDragstart={() => setIsDragging(true)}
      >
        <BusStopCustomMarkers
          stops={busStops}
          selectedStopId={selectedStopId}
          onStopClick={selectStop}
          onCloseClick={clearSelection}
        />
        {userLocation && <UserLocationMarker location={userLocation} />}
      </GoogleMap>
    </div>
  );
}
