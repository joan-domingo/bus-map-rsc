import busLineData from "./busLineData.json";

/** Lines with the most Search Console impressions/clicks (updated periodically). */
const SEARCH_PRIORITY_LINES = [
  "n80",
  "c30",
  "x30",
  "c19",
  "c20",
  "e3",
  "n61",
  "b1",
  "n62",
  "c5",
  "cv3",
  "b7",
] as const;

export interface LinePageSeo {
  title: string;
  description: string;
}

export interface HomePageSeo {
  title: string;
  description: string;
}

/** SERP copy aligned with queries like "n80", "c19 bus", "moventis temps real". */
export function buildLinePageSeo(lineName: string): LinePageSeo {
  const line = lineName.toUpperCase();
  return {
    title: `Bus ${line} temps real · Moventis`,
    description: `Línia ${line} Moventis en temps real (tiempo real): properes arribades, parades al mapa i horaris del bus ${line} actualitzats.`,
  };
}

export function buildHomePageSeo(): HomePageSeo {
  return {
    title: "Moventis temps real | Mapa busos",
    description:
      "Moventis en temps real: mapa interactiu amb parades, horaris i línies N80, C30, X30, E3, N61 i més.",
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
  const lineData = busLineData[lineStopId as keyof typeof busLineData];
  if (!lineData?.name) {
    return null;
  }
  return lineNameToSlug(lineData.name);
}

export function buildLinePagePath(slug: string): string {
  return `/linea/${slug.toLowerCase()}`;
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

function isInternalLineStopIdSlug(slug: string): boolean {
  if (!Object.hasOwn(busLineData, slug)) {
    return false;
  }
  const lineData = busLineData[slug as keyof typeof busLineData];
  return lineNameToSlug(lineData.name) !== slug;
}

export interface ResolvedLineSlug {
  canonicalSlug: string;
  lineName: string;
  lineStopIds: string[];
}

/** Resolves /linea/{slug} using the line name slug only (e.g. c1, n80), never internal numeric ids. */
export function resolveLineSlug(rawSlug: string): ResolvedLineSlug | null {
  const normalizedInput = normalizeLineSlug(rawSlug);
  if (!normalizedInput || isInternalLineStopIdSlug(normalizedInput)) {
    return null;
  }

  const lineStopIds = Object.entries(busLineData)
    .filter(([, data]) => lineNameToSlug(data.name) === normalizedInput)
    .map(([lineStopId]) => lineStopId);

  if (lineStopIds.length === 0) {
    return null;
  }

  const lineName = busLineData[lineStopIds[0] as keyof typeof busLineData]?.name;
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
