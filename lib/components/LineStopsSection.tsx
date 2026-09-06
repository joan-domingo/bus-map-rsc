"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { BusStop } from "../types";
import { STOPS_SHEET_PEEK } from "./lineStopsSheet";

const SHEET_HEIGHT = "85dvh";
const DOCKED_TRANSFORM = `translateY(calc(100% - ${STOPS_SHEET_PEEK}))`;

interface LineStopsSectionProps {
  lineName: string;
  stops: BusStop[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * The crawlable half of a line page, as a phone-style bottom sheet: docked at
 * the bottom showing its header, dragged or tapped up to slide over the map.
 *
 * The map is a client-rendered canvas, so without this the page has almost no
 * text for "paradas {line}", "recorrido {line}" or the town names that only
 * appear in stop names ("Parc Taulí", "El Masnou", "Montgat") to match on.
 * That is why the list is always rendered and merely clipped by the sheet --
 * mounting it only once expanded would take it out of the HTML, and hiding it
 * outright would make it text that exists for crawlers but not for people.
 */
export function LineStopsSection({ lineName, stops }: LineStopsSectionProps) {
  const listId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef({ y: 0, translate: 0, moved: false });
  const [expanded, setExpanded] = useState(false);
  /** Live translateY while a drag is in progress, in px; null when settled. */
  const [dragTranslate, setDragTranslate] = useState<number | null>(null);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  if (stops.length === 0) {
    return null;
  }

  const line = lineName.toUpperCase();

  /** How far the sheet travels between expanded and docked, in px. */
  const travel = () =>
    Math.max(
      0,
      (sheetRef.current?.offsetHeight ?? 0) -
        (headerRef.current?.offsetHeight ?? 0),
    );

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const translate = expanded ? 0 : travel();
    dragStart.current = { y: event.clientY, translate, moved: false };
    setDragTranslate(translate);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragTranslate === null) {
      return;
    }
    const delta = event.clientY - dragStart.current.y;
    if (Math.abs(delta) > 4) {
      dragStart.current.moved = true;
    }
    setDragTranslate(clamp(dragStart.current.translate + delta, 0, travel()));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragTranslate === null) {
      return;
    }
    // A tap settles through onClick instead: deciding here as well would let
    // the two handlers fight over the same tap.
    if (dragStart.current.moved) {
      // Settle to whichever end of the travel the sheet was left nearest
      setExpanded(dragTranslate < travel() / 2);
    }
    setDragTranslate(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const onClick = () => {
    // A drag already chose the resting state, and browsers still fire a click
    // afterwards; only a real tap toggles.
    if (dragStart.current.moved) {
      dragStart.current.moved = false;
      return;
    }
    setExpanded((open) => !open);
  };

  const transform =
    dragTranslate !== null
      ? `translateY(${dragTranslate}px)`
      : expanded
        ? "translateY(0)"
        : DOCKED_TRANSFORM;

  return (
    <section
      ref={sheetRef}
      aria-label={`Parades de la línia ${line}`}
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-white text-black shadow-[0_-2px_16px_rgba(0,0,0,0.25)]"
      style={{
        height: SHEET_HEIGHT,
        transform,
        transition:
          dragTranslate === null
            ? "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)"
            : "none",
      }}
    >
      <button
        ref={headerRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex shrink-0 cursor-grab touch-none flex-col justify-center px-4 text-left active:cursor-grabbing"
        style={{ height: STOPS_SHEET_PEEK }}
      >
        <span
          aria-hidden
          className="mx-auto mb-2 block h-1 w-10 rounded-full bg-gray-300"
        />
        <span className="block text-base font-bold leading-tight">
          Parades de la línia {line}
        </span>
        <span className="block text-xs leading-tight text-gray-600">
          {stops.length} parades · {expanded ? "Tanca" : "Desplega"} per
          veure-les
        </span>
      </button>

      <div
        id={listId}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-10"
        // Only the expanded sheet is reachable, so keep the clipped list out
        // of the tab order while it is docked.
        inert={!expanded}
      >
        <p className="mb-1 text-sm">
          La línia {line} de Moventis té {stops.length} parades. Toca qualsevol
          parada del mapa per veure les properes arribades i els horaris en
          temps real.
        </p>
        <p className="mb-4 text-sm text-gray-700">
          Paradas y recorrido de la línea {line} de Moventis: consulta los
          horarios y las próximas llegadas en tiempo real.
        </p>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2 md:grid-cols-3">
          {stops.map((stop) => (
            <li key={stop.id}>{stop.name}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
