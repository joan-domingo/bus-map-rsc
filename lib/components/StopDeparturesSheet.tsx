"use client";

import { useEffect, useId, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useMapStore } from "../store/useMapStore";
import { useStarredStops } from "../store/useStarredStops";
import type { BusStop } from "../types";
import { trackEvent } from "../utils/analytics";
import MarkerTimetable from "./MarkerTimetable";

interface Props {
  stop: BusStop;
  onClose: () => void;
}

function formatUpdatedAt(timestamp: number): string {
  return new Intl.DateTimeFormat("ca", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function StopDeparturesSheet({ stop, onClose }: Props) {
  const headingId = useId();
  const departuresId = useId();
  const departuresHeadingId = useId();
  const [expandedStopId, setExpandedStopId] = useState<number | null>(null);
  const expanded = expandedStopId === stop.id;
  const {
    selectedStopTimetable,
    isLoading,
    isLoaded,
    error,
    updatedAt,
    loadBusStopTimeTable,
  } = useMapStore(
    useShallow((state) => ({
      selectedStopTimetable: state.selectedStopTimetable,
      isLoading: state.selectedStopTimetableIsLoading,
      isLoaded: state.selectedStopTimetableIsLoaded,
      error: state.selectedStopTimetableError,
      updatedAt: state.selectedStopTimetableUpdatedAt,
      loadBusStopTimeTable: state.loadBusStopTimeTable,
    })),
  );
  const starredStopIdsArray = useStarredStops(
    (state) => state.starredStopIdsArray,
  );
  const toggleStar = useStarredStops((state) => state.toggleStar);
  const starred = starredStopIdsArray.includes(stop.id);
  const departureCount =
    selectedStopTimetable?.reduce(
      (count, line) => count + line.nextBuses.length,
      0,
    ) ?? 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleToggleStar = () => {
    const wasStarred = starred;
    toggleStar(stop.id);
    trackEvent("bus_stop_star", {
      stop_id: stop.id,
      stop_name: stop.name,
      action: wasStarred ? "unstar" : "star",
      bus_lines: stop.buses.join(","),
    });
  };

  const handleRefresh = () => {
    void loadBusStopTimeTable(stop.id, stop.lineId, stop.zoneId);
  };

  return (
    <section
      aria-labelledby={headingId}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-2xl bg-gray-50 text-black shadow-[0_-2px_16px_rgba(0,0,0,0.25)] ${expanded ? "h-[85dvh] sm:h-[min(85dvh,48rem)]" : "h-[55dvh] sm:h-[min(60dvh,36rem)]"} sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[26rem] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl`}
    >
      <header className="flex shrink-0 items-center gap-3 bg-[#088b9f] px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/85">Parada {stop.id}</p>
          <h2 className="truncate text-lg font-bold" id={headingId}>
            {stop.name}
          </h2>
        </div>
        <button
          aria-label={
            starred ? "Eliminar dels preferits" : "Afegir als preferits"
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl hover:bg-white/25"
          onClick={handleToggleStar}
          title={starred ? "Eliminar dels preferits" : "Afegir als preferits"}
          type="button"
        >
          {starred ? "★" : "☆"}
        </button>
        <button
          aria-label="Tanca els horaris de la parada"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl hover:bg-white/25"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div>
          <h3 className="font-semibold" id={departuresHeadingId}>
            Properes arribades
          </h3>
          {updatedAt !== null && (
            <p className="text-xs text-gray-500">
              Actualitzat a {formatUpdatedAt(updatedAt)}
            </p>
          )}
        </div>
        <button
          aria-label="Actualitza les arribades"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xl hover:bg-gray-100 disabled:opacity-50"
          disabled={isLoading}
          onClick={handleRefresh}
          title="Actualitza les arribades"
          type="button"
        >
          ↻
        </button>
      </div>

      <section
        aria-busy={isLoading}
        aria-labelledby={departuresHeadingId}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4"
        id={departuresId}
        style={{
          paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <MarkerTimetable
          error={error}
          expanded={expanded}
          isLoaded={isLoaded}
          isLoading={isLoading}
          onRetry={handleRefresh}
          selectedStopTimetable={selectedStopTimetable}
        />
        {!isLoading && !error && departureCount > 0 && (
          <button
            aria-expanded={expanded}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-[#087f91] hover:bg-gray-100"
            onClick={() => setExpandedStopId(expanded ? null : stop.id)}
            type="button"
          >
            {expanded ? "Mostra menys" : "Veure tots els horaris"}
          </button>
        )}
      </section>
    </section>
  );
}
