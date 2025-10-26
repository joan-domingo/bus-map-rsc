import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import type { BusStop } from "../types";
import { MarkerWithInfowindow } from "./MarkerWithInfoWindow";

interface BusStopCustomMarkersProps {
  stops: BusStop[];
  selectedStopId: number | null;
  onStopClick: (stop: BusStop) => void;
  onCloseClick: () => void;
}

export const BusStopCustomMarkers = ({
  stops,
  selectedStopId,
  onStopClick,
  onCloseClick,
}: BusStopCustomMarkersProps) => {
  const map = useMap();
  const [visibleStops, setVisibleStops] = useState<BusStop[]>(stops);

  // Filter stops based on viewport and zoom for performance
  useEffect(() => {
    if (!map) {
      setVisibleStops(stops);
      return;
    }

    const updateVisibleStops = () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom() || 15;

      if (!bounds) {
        setVisibleStops(stops);
        return;
      }

      // Reduced marker limits for better performance
      const maxMarkers = 200;

      // Expand bounds by 20% to include markers slightly outside viewport
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latSpan = ne.lat() - sw.lat();
      const lngSpan = ne.lng() - sw.lng();
      const expansion = 0.2; // 20% expansion

      const expandedBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(
          sw.lat() - latSpan * expansion,
          sw.lng() - lngSpan * expansion,
        ),
        new google.maps.LatLng(
          ne.lat() + latSpan * expansion,
          ne.lng() + lngSpan * expansion,
        ),
      );

      // Filter stops in expanded viewport
      const stopsInViewport = stops.filter((stop) => {
        const position = new google.maps.LatLng(stop.lat, stop.lon);
        return expandedBounds.contains(position);
      });

      // Always include selected stop
      const selectedStop = selectedStopId
        ? stops.find((s) => s.id === selectedStopId)
        : null;

      // Spatial distribution: divide viewport into grid and select stops from each cell
      const gridSize = Math.max(1, Math.ceil(Math.sqrt(maxMarkers / 4))); // Adjust grid density based on marker limit
      const latStep = latSpan / gridSize;
      const lngStep = lngSpan / gridSize;

      const gridCells: BusStop[][] = Array.from(
        { length: gridSize * gridSize },
        () => [],
      );

      // Distribute stops into grid cells
      for (const stop of stopsInViewport) {
        const latIndex = Math.max(
          0,
          Math.min(Math.floor((stop.lat - sw.lat()) / latStep), gridSize - 1),
        );
        const lngIndex = Math.max(
          0,
          Math.min(Math.floor((stop.lon - sw.lng()) / lngStep), gridSize - 1),
        );
        const cellIndex = latIndex * gridSize + lngIndex;

        // Additional safety check
        if (
          cellIndex >= 0 &&
          cellIndex < gridCells.length &&
          gridCells[cellIndex]
        ) {
          gridCells[cellIndex].push(stop);
        }
      }

      // Select stops from each cell to ensure even distribution
      const maxStopsPerCell = Math.ceil(maxMarkers / (gridSize * gridSize));
      let filteredStops: BusStop[] = [];

      for (let i = 0; i < gridCells.length; i++) {
        const cellStops = gridCells[i];
        if (cellStops.length > 0) {
          // Sort by distance to cell center for better selection
          const cellCenterLat =
            sw.lat() + (Math.floor(i / gridSize) + 0.5) * latStep;
          const cellCenterLng = sw.lng() + ((i % gridSize) + 0.5) * lngStep;

          const sortedCellStops = cellStops
            .map((stop) => ({
              stop,
              distance: Math.sqrt(
                (stop.lat - cellCenterLat) ** 2 +
                  (stop.lon - cellCenterLng) ** 2,
              ),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxStopsPerCell)
            .map((item) => item.stop);

          filteredStops.push(...sortedCellStops);
        }
      }

      // Ensure we don't exceed the total limit
      filteredStops = filteredStops.slice(0, maxMarkers);

      // Ensure selected stop is included
      if (selectedStop && !filteredStops.includes(selectedStop)) {
        filteredStops = [
          selectedStop,
          ...filteredStops.slice(0, maxMarkers - 1),
        ];
      }

      // Fallback: if we have very few markers, show more from the general area using spatial distribution
      if (filteredStops.length < Math.min(20, maxMarkers * 0.5) && zoom >= 14) {
        const center = bounds.getCenter();
        const centerLat = center.lat();
        const centerLng = center.lng();

        // Get nearby stops with distance calculation
        const nearbyStops = stops
          .map((stop) => ({
            stop,
            distance: Math.sqrt(
              (stop.lat - centerLat) ** 2 + (stop.lon - centerLng) ** 2,
            ),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, Math.min(maxMarkers * 2, 200)) // Get more candidates for better distribution
          .map((item) => item.stop);

        // Apply grid distribution to nearby stops as well
        const fallbackGridSize = Math.max(
          1,
          Math.ceil(Math.sqrt(maxMarkers / 2)),
        );
        const fallbackLatStep = (latSpan * 2) / fallbackGridSize; // Larger area for fallback
        const fallbackLngStep = (lngSpan * 2) / fallbackGridSize;

        const fallbackGridCells: BusStop[][] = Array.from(
          { length: fallbackGridSize * fallbackGridSize },
          () => [],
        );

        for (const stop of nearbyStops) {
          const latIndex = Math.max(
            0,
            Math.min(
              Math.floor((stop.lat - (centerLat - latSpan)) / fallbackLatStep),
              fallbackGridSize - 1,
            ),
          );
          const lngIndex = Math.max(
            0,
            Math.min(
              Math.floor((stop.lon - (centerLng - lngSpan)) / fallbackLngStep),
              fallbackGridSize - 1,
            ),
          );
          const cellIndex = latIndex * fallbackGridSize + lngIndex;

          // Additional safety check
          if (
            cellIndex >= 0 &&
            cellIndex < fallbackGridCells.length &&
            fallbackGridCells[cellIndex]
          ) {
            fallbackGridCells[cellIndex].push(stop);
          }
        }

        // Merge with existing, avoiding duplicates and maintaining spatial distribution
        const combined = [...filteredStops];
        const maxStopsPerFallbackCell = Math.ceil(
          (maxMarkers - filteredStops.length) /
            (fallbackGridSize * fallbackGridSize),
        );

        for (const cellStops of fallbackGridCells) {
          if (cellStops.length > 0 && combined.length < maxMarkers) {
            const stopsToAdd = cellStops
              .slice(0, maxStopsPerFallbackCell)
              .filter((stop) => !combined.find((s) => s.id === stop.id));

            combined.push(...stopsToAdd.slice(0, maxMarkers - combined.length));
          }
        }

        filteredStops = combined;
      }

      setVisibleStops(filteredStops);
    };

    // Initial update
    updateVisibleStops();

    // Listen for map changes with debouncing for better performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateVisibleStops, 150);
    };

    const boundsListener = map.addListener("bounds_changed", debouncedUpdate);
    const zoomListener = map.addListener("zoom_changed", updateVisibleStops); // Immediate for zoom

    return () => {
      clearTimeout(timeoutId);
      boundsListener.remove();
      zoomListener.remove();
    };
  }, [map, stops, selectedStopId]);

  return (
    <>
      {visibleStops.map((stop) => (
        <MarkerWithInfowindow
          key={stop.id}
          stop={stop}
          onClick={() => onStopClick(stop)}
          visible={selectedStopId === stop.id}
          onCloseClick={onCloseClick}
        />
      ))}
    </>
  );
};
