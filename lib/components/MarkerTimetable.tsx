import type { CustomBusLineJourney, CustomBusLineTimetable } from "../types";
import {
  buildLinePagePath,
  getLineStopDisplayName,
  lineStopIdToSlug,
} from "../utils/seo";
import { BusLineBadge } from "./BusLineBadge";

interface Props {
  selectedStopTimetable: CustomBusLineTimetable[] | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  expanded: boolean;
  onRetry: () => void;
}

const COLLAPSED_DEPARTURE_LIMIT = 4;
const LOWERCASE_DESTINATION_WORDS = new Set([
  "de",
  "del",
  "dels",
  "el",
  "els",
  "i",
  "la",
  "les",
]);

function getArrivalOffsetMinutes(
  departure: CustomBusLineJourney,
  now: Date,
): number {
  const displayTime = departure.real
    ? departure.minutesLeft
    : departure.departureTime;

  if (displayTime === "<1 min") {
    return 0;
  }

  const relativeTime = displayTime.match(
    /^(?:(\d+)\s*h)?(?:\s*(\d+)\s*min)?$/i,
  );
  if (relativeTime && (relativeTime[1] || relativeTime[2])) {
    return Number(relativeTime[1] ?? 0) * 60 + Number(relativeTime[2] ?? 0);
  }

  const scheduledTime = displayTime.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (scheduledTime?.[1] && scheduledTime[2]) {
    const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes();
    const scheduledMinuteOfDay =
      Number(scheduledTime[1]) * 60 + Number(scheduledTime[2]);
    const minutesUntilDeparture = scheduledMinuteOfDay - currentMinuteOfDay;

    return minutesUntilDeparture < 0
      ? minutesUntilDeparture + 24 * 60
      : minutesUntilDeparture;
  }

  throw new Error(`Unexpected departure time: ${displayTime}`);
}

function getDestinationTerminal(destination: string): string {
  const segments = destination.trim().split(/\s+-\s+/);
  const lastSegment = segments[segments.length - 1] ?? destination.trim();

  return lastSegment.split(/\s+(?:pel|per|via)\s+/i)[0]?.trim() ?? lastSegment;
}

function normalizeDestination(destination: string): string {
  return destination
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ca");
}

function areDestinationAliases(first: string, second: string): boolean {
  const normalizedFirst = normalizeDestination(first);
  const normalizedSecond = normalizeDestination(second);
  if (normalizedFirst === normalizedSecond) {
    return true;
  }

  const [shorter, longer] =
    normalizedFirst.length < normalizedSecond.length
      ? [normalizedFirst, normalizedSecond]
      : [normalizedSecond, normalizedFirst];
  if (!longer.startsWith(`${shorter} `)) {
    return false;
  }

  const remainingWords = longer.slice(shorter.length + 1);
  return /^(?:de(?:l|ls)?\s|d'|la\s|les\s|el\s|els\s|i\s)/.test(remainingWords);
}

function formatDestination(destination: string): string {
  return destination
    .toLocaleLowerCase("ca")
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && LOWERCASE_DESTINATION_WORDS.has(word)) {
        return word;
      }

      return `${word.charAt(0).toLocaleUpperCase("ca")}${word.slice(1)}`;
    })
    .join(" ");
}

function getCompactDestination(
  line: CustomBusLineTimetable,
  departure: CustomBusLineJourney,
): string {
  const destination = getDestinationTerminal(departure.name);
  const matchingDestination = line.nextBuses
    .map((bus) => getDestinationTerminal(bus.name))
    .filter((candidate) => areDestinationAliases(destination, candidate))
    .sort((first, second) => first.length - second.length)[0];

  return formatDestination(matchingDestination ?? destination);
}

const MarkerTimetable = ({
  selectedStopTimetable,
  isLoading,
  isLoaded,
  error,
  expanded,
  onRetry,
}: Props) => {
  if (isLoading) {
    return (
      <output className="flex items-center justify-center gap-3 p-6 text-black">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" />
        Carregant properes arribades…
      </output>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center gap-3 p-6 text-center text-black"
        role="alert"
      >
        <p>
          No s'han pogut carregar les dades. Si us plau, torna-ho a intentar més
          tard.
        </p>
        <button
          className="rounded-full border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-100"
          onClick={onRetry}
          type="button"
        >
          Torna-ho a provar
        </button>
      </div>
    );
  }

  if (!isLoaded || !selectedStopTimetable) {
    return null;
  }

  if (selectedStopTimetable.length === 0) {
    return (
      <p className="p-6 text-center text-gray-700">
        Cap autobús previst properament.
      </p>
    );
  }

  if (!expanded) {
    const now = new Date();
    const upcomingDepartures = selectedStopTimetable
      .flatMap((line) =>
        line.nextBuses.map((bus, index) => ({
          bus,
          index,
          line,
          minutesUntilDeparture: getArrivalOffsetMinutes(bus, now),
        })),
      )
      .sort(
        (first, second) =>
          first.minutesUntilDeparture - second.minutesUntilDeparture,
      )
      .slice(0, COLLAPSED_DEPARTURE_LIMIT);

    return (
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {upcomingDepartures.map(({ bus, index, line }) => {
          const lineStopId = line.lineId.toString();
          const time = bus.real ? bus.minutesLeft : bus.departureTime;
          const status = bus.real ? "En temps real" : "Horari";

          return (
            <li
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2"
              key={`${line.lineId}-${index}`}
            >
              <BusLineBadge
                className="h-7 min-w-10 text-sm"
                lineStopId={lineStopId}
              />
              <div className="min-w-0">
                <span className="block truncate text-sm text-gray-800">
                  {getCompactDestination(line, bus)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    aria-hidden
                    className={`h-2 w-2 rounded-full ${bus.real ? "bg-amber-400" : "bg-gray-400"}`}
                  />
                  {status}
                </span>
              </div>
              <span className="text-right text-lg font-bold tabular-nums text-gray-900">
                {time}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {selectedStopTimetable.map((line) => {
        const lineStopId = line.lineId.toString();
        const lineSlug = lineStopIdToSlug(lineStopId);

        const lineHeading = (
          <>
            <BusLineBadge
              className="h-7 min-w-10 text-sm"
              lineStopId={lineStopId}
            />
            <span>{line.lineName}</span>
          </>
        );

        return (
          <section
            aria-label={`Línia ${getLineStopDisplayName(lineStopId)}`}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            key={line.lineId}
          >
            <h4 className="border-b border-gray-100 px-3 py-2">
              {lineSlug ? (
                <a
                  className="flex items-center gap-2 font-semibold hover:underline"
                  href={buildLinePagePath(lineSlug)}
                  title={`Veure les parades de la línia ${getLineStopDisplayName(lineStopId)}`}
                >
                  {lineHeading}
                </a>
              ) : (
                <span className="flex items-center gap-2 font-semibold">
                  {lineHeading}
                </span>
              )}
            </h4>
            <ul className="divide-y divide-gray-100">
              {line.nextBuses.map((bus) => {
                const time = bus.real ? bus.minutesLeft : bus.departureTime;
                const status = bus.real ? "En temps real" : "Horari";

                return (
                  <li
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2"
                    key={`${bus.name}-${time}-${bus.real}`}
                  >
                    <span className="truncate text-sm text-gray-800">
                      {bus.name}
                    </span>
                    <span className="row-span-2 text-right text-lg font-bold tabular-nums text-gray-900">
                      {time}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span
                        aria-hidden
                        className={`h-2 w-2 rounded-full ${bus.real ? "bg-amber-400" : "bg-gray-400"}`}
                      />
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default MarkerTimetable;
