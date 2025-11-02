"use client";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useBusStopSelection } from "../hooks/useBusStopSelection";
import type { BusStop, UserLocation } from "../types";
import { BusStopCustomMarkers } from "./BusStopCustomMarker";
import { UserLocationMarker } from "./UserLocationMarker";

interface MapProps {
  busStops: BusStop[];
  userLocation: UserLocation | undefined;
  isDragging: boolean;
  zoom: number;
  setIsDragging: (isDragging: boolean) => void;
  setZoom: (zoom: number) => void;
}

export function BusMap({
  busStops,
  userLocation,
  isDragging,
  zoom,
  setIsDragging,
  setZoom,
}: MapProps) {
  const { selectedStopId, selectStop, clearSelection } = useBusStopSelection();

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
