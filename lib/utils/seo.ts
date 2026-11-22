import busLineData from "./busLineData.json";

/**
 * Lines with the most Search Console clicks/impressions, best first. Only the
 * first six are rendered (see getVisiblePriorityLineSlugs), so the order is
 * what decides which pages the home page and header link to on every view.
 *
 * Last refreshed from Search Console on 2026-11-21, from 2026-08-20 to
 * 2026-11-19. Figures below are clicks / impressions for that window.
 */
const SEARCH_PRIORITY_LINES = [
  "c10", // 1245 / 32924
  "e3", // 713 / 19206
  "c30", // 315 / 13929
  "e11.1", // 286 / 10090
  "e2.1", // 256 / 6857
  "a4", // 158 / 8680
  "b2", // 148 / 8063
  "e2.2", // 126 / 4351
  "b8", // 98 / 2956
  "805", // 85 / 6352
  "e11.2", // 80 / 8254
  "808", // 70 / 4943
  "n80", // 67 / 5557
  "c5", // 63 / 2770
  "648", // 61 / 3626
  "b1", // 61 / 3319
  "c13", // 59 / 869
  "b7", // 51 / 4530
  "e1", // 47 / 2858
  "n62", // 40 / 2437
] as const;

const SEARCH_LINE_ALIASES: Record<
  string,
  {
    name: string;
    lineStopIds: string[];
  }
> = {
  n80: { name: "N80", lineStopIds: ["68"] },
  n81: { name: "N81", lineStopIds: ["70"] },
  c10: { name: "C10", lineStopIds: ["53"] },
  c18: { name: "C18", lineStopIds: ["385"] },
  c19: { name: "C19", lineStopIds: ["340"] },
  c20: { name: "C20", lineStopIds: ["57"] },
  c22: { name: "C22", lineStopIds: ["58"] },
  c30: { name: "C30", lineStopIds: ["59"] },
  "805": { name: "805", lineStopIds: ["49"] },
  "806": { name: "806", lineStopIds: ["335"] },
  "808": { name: "808", lineStopIds: ["266"] },
};

export interface LinePageSeo {
  title: string;
  description: string;
}

export interface HomePageSeo {
  title: string;
  description: string;
}

/**
 * SERP copy aligned with queries like "n80", "c19 bus", "moventis temps real".
 *
 * The description closes in Spanish because most of the long tail is: Search
 * Console shows "horarios", "paradas" and "linea X" across hundreds of Spanish
 * queries, against a Catalan phrasing that only matched "horaris"/"parades".
 */
export function buildLinePageSeo(
  lineName: string,
  municipalities: string[] = [],
): LinePageSeo {
  const line = lineName.toUpperCase();
  const baseDescription = `Bus ${line} de Moventis en temps real: properes arribades, parades i horaris. Paradas y horarios de la línea ${line} en tiempo real.`;
  let description = baseDescription;
  const servedMunicipalities: string[] = [];

  for (const municipality of municipalities) {
    const candidateMunicipalities = [...servedMunicipalities, municipality];
    const candidateDescription = `Bus ${line} de Moventis en temps real a ${candidateMunicipalities.join(", ")}. Properes arribades, parades i horaris. Paradas y horarios de la línea ${line} en tiempo real.`;
    if (candidateDescription.length > 160) {
      break;
    }

    servedMunicipalities.push(municipality);
    description = candidateDescription;
  }

  return {
    title: `Bus ${line} temps real i tiempo real · Moventis`,
    description,
  };
}

export function buildHomePageSeo(): HomePageSeo {
  const featuredLines = SEARCH_PRIORITY_LINES.slice(0, 5)
    .map((line) => line.toUpperCase())
    .join(", ");

  return {
    title: "Moventis temps real i tiempo real | QuanTriga",
    description: `Quan arriba el teu bus? Moventis en temps real i tiempo real: mapa de parades, properes arribades i horaris de les línies ${featuredLines}.`,
  };
}

/** Normalizes a Moventis line name to the canonical URL slug (e.g. "C-30" → "c30"). */
export function lineNameToSlug(lineName: string): string {
  return lineName
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.]/g, "");
}

function normalizeLineSlug(value: string): string {
  return lineNameToSlug(value);
}

/** Maps an internal busLineData key (e.g. "14") to a public URL slug (e.g. "b1"). */
export function lineStopIdToSlug(lineStopId: string): string | null {
  const aliasEntry = Object.entries(SEARCH_LINE_ALIASES).find(([, data]) =>
    data.lineStopIds.includes(lineStopId),
  );
  if (aliasEntry) {
    return aliasEntry[0];
  }

  const lineData = busLineData[lineStopId as keyof typeof busLineData];
  if (!lineData?.name) {
    return null;
  }
  return lineNameToSlug(lineData.name);
}

export function getLineStopDisplayName(lineStopId: string): string {
  const aliasEntry = Object.values(SEARCH_LINE_ALIASES).find((data) =>
    data.lineStopIds.includes(lineStopId),
  );
  if (aliasEntry) {
    return aliasEntry.name;
  }

  return (
    busLineData[lineStopId as keyof typeof busLineData]?.name ?? lineStopId
  );
}

export function getLineStopColor(lineStopId: string): string {
  return (
    busLineData[lineStopId as keyof typeof busLineData]?.color ?? "#088b9f"
  );
}

/** Relative luminance per WCAG 2.1, from a #rrggbb color. */
function getRelativeLuminance(hexColor: string): number {
  const hex = hexColor.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Minimum contrast we accept before giving up on white text. Line colors span
 * #D40011 to #FF134A for what all reads as "red", and picking whichever of
 * black/white contrasts more would split that range mid-way, so near-identical
 * reds would get opposite labels. Preferring white down to this floor keeps
 * every red (and the mid-tone blues, greens and teals) on white, and still
 * catches the bright yellows, limes and cyans where white is unreadable.
 */
const MIN_WHITE_TEXT_CONTRAST = 3.6;

/** White label on a line color, or black where white would be unreadable. */
export function getLineStopTextColor(lineStopId: string): string {
  const luminance = getRelativeLuminance(getLineStopColor(lineStopId));
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithWhite >= MIN_WHITE_TEXT_CONTRAST ? "#ffffff" : "#000000";
}

/**
 * Short label for the map marker badge. Drops the redundant "Línia " prefix
 * (e.g. "Línia V4.1" -> "V4.1") so long names stay inside the badge.
 */
export function getLineStopBadgeLabel(lineStopId: string): string {
  return getLineStopDisplayName(lineStopId)
    .toUpperCase()
    .replace(/^L[IÍ]NIA\s+/, "")
    .replaceAll("-", "");
}

export function buildLinePagePath(slug: string): string {
  return `/linia/${slug.toLowerCase()}`;
}

export function buildLinePagePathFromName(lineName: string): string {
  return buildLinePagePath(lineNameToSlug(lineName));
}

export function buildLineOgImagePath(slug: string): string {
  return `/og-image/${slug.toLowerCase()}`;
}

/** @deprecated Use buildLineOgImagePath */
export function getLineOgImagePath(slug: string): string {
  return buildLineOgImagePath(slug);
}

export interface ResolvedLineSlug {
  canonicalSlug: string;
  lineName: string;
  lineStopIds: string[];
}

/**
 * Resolves /linia/{slug} by line name only (e.g. c1, n80), so an internal
 * busLineData key never becomes a URL: a slug is only ever matched against
 * line *names*, and one that appears solely as a key resolves to nothing.
 *
 * Some lines are named after another line's key -- id "86" is named "14",
 * which is also the key of line B1 -- and those resolve to the line that
 * carries the name, never to the line that happens to use it as a key.
 */
export function resolveLineSlug(rawSlug: string): ResolvedLineSlug | null {
  const normalizedInput = normalizeLineSlug(rawSlug);
  if (!normalizedInput) {
    return null;
  }

  const searchAlias = SEARCH_LINE_ALIASES[normalizedInput];
  if (searchAlias) {
    return {
      canonicalSlug: normalizedInput,
      lineName: searchAlias.name,
      lineStopIds: searchAlias.lineStopIds,
    };
  }

  const lineStopIds = Object.entries(busLineData)
    .filter(([, data]) => lineNameToSlug(data.name) === normalizedInput)
    .map(([lineStopId]) => lineStopId);

  if (lineStopIds.length === 0) {
    return null;
  }

  const lineName =
    busLineData[lineStopIds[0] as keyof typeof busLineData]?.name;
  if (!lineName) {
    return null;
  }

  return {
    canonicalSlug: lineNameToSlug(lineName),
    lineName,
    lineStopIds,
  };
}

export interface SeoLineEntry {
  slug: string;
  name: string;
}

export function getAllLineSlugs(): string[] {
  const slugSet = new Set<string>();

  for (const slug of Object.keys(SEARCH_LINE_ALIASES)) {
    slugSet.add(slug);
  }

  for (const lineData of Object.values(busLineData)) {
    const slug = lineNameToSlug(lineData.name);
    if (slug) {
      slugSet.add(slug);
    }
  }

  return [...slugSet].sort();
}

export function getAllSeoLineEntries(): SeoLineEntry[] {
  const lineMap = new Map<string, string>();

  for (const [slug, data] of Object.entries(SEARCH_LINE_ALIASES)) {
    lineMap.set(slug, data.name);
  }

  for (const lineData of Object.values(busLineData)) {
    const slug = lineNameToSlug(lineData.name);
    if (!slug || lineMap.has(slug)) {
      continue;
    }
    lineMap.set(slug, lineData.name);
  }

  return [...lineMap.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ca"));
}

export function getLineIdsBySlug(slug: string): string[] {
  return resolveLineSlug(slug)?.lineStopIds ?? [];
}

export function getCanonicalLineName(slug: string): string | null {
  return resolveLineSlug(slug)?.lineName ?? null;
}

export function getPriorityLineSlugs(): string[] {
  return [...SEARCH_PRIORITY_LINES];
}

export function getVisiblePriorityLineSlugs(): string[] {
  return SEARCH_PRIORITY_LINES.slice(0, 6);
}
