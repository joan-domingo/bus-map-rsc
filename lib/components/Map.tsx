"use client";

import { Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useCallback } from "react";
import { useBusStopSelection } from "../hooks/useBusStopSelection";
import type { BusStop, UserLocation } from "../types";
import { BusStopCustomMarkers } from "./BusStopCustomMarker";
import { StopDeparturesSheet } from "./StopDeparturesSheet";
import { UserLocationMarker } from "./UserLocationMarker";

interface MapProps {
  busStops: BusStop[];
  userLocation: UserLocation | undefined;
  isDragging: boolean;
  zoom: number;
  setIsDragging: (isDragging: boolean) => void;
  setZoom: (zoom: number) => void;
  onStopSelectionChange: (selected: boolean) => void;
}

export function BusMap({
  busStops,
  userLocation,
  isDragging,
  zoom,
  setIsDragging,
  setZoom,
  onStopSelectionChange,
}: MapProps) {
  const { selectedStopId, selectStop, clearSelection } = useBusStopSelection();
  const selectedStop =
    busStops.find((stop) => stop.id === selectedStopId) ?? null;

  const handleSelectStop = useCallback(
    async (stop: BusStop) => {
      onStopSelectionChange(true);
      await selectStop(stop);
    },
    [onStopSelectionChange, selectStop],
  );
  const handleCloseStop = useCallback(() => {
    clearSelection();
    onStopSelectionChange(false);
  }, [clearSelection, onStopSelectionChange]);

  return (
    <div className="relative h-full w-full">
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
          onStopClick={handleSelectStop}
        />
        {userLocation && <UserLocationMarker location={userLocation} />}
      </GoogleMap>
      {selectedStop && (
        <StopDeparturesSheet stop={selectedStop} onClose={handleCloseStop} />
      )}
    </div>
  );
}
