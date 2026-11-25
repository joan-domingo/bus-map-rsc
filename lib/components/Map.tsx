"use client";

import { useCallback } from "react";
import { useBusStopSelection } from "../hooks/useBusStopSelection";
import type { BusStop, UserLocation } from "../types";
import { MapboxMap } from "./MapboxMap";
import { StopDeparturesSheet } from "./StopDeparturesSheet";

interface MapProps {
  accessToken?: string;
  busStops: BusStop[];
  userLocation: UserLocation | undefined;
  isDragging: boolean;
  zoom: number;
  setIsDragging: (isDragging: boolean) => void;
  setZoom: (zoom: number) => void;
  onStopSelectionChange: (selected: boolean) => void;
  onMapError: (error: unknown) => void;
}

export function BusMap({
  accessToken,
  busStops,
  userLocation,
  isDragging,
  zoom,
  setIsDragging,
  setZoom,
  onStopSelectionChange,
  onMapError,
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
      <MapboxMap
        accessToken={accessToken}
        busStops={busStops}
        selectedStopId={selectedStopId}
        userLocation={userLocation}
        isDragging={isDragging}
        zoom={zoom}
        onStopClick={handleSelectStop}
        setIsDragging={setIsDragging}
        setZoom={setZoom}
        onMapError={onMapError}
      />
      {selectedStop && (
        <StopDeparturesSheet stop={selectedStop} onClose={handleCloseStop} />
      )}
    </div>
  );
}
