import busLineData from "./busLineData.json";

/** Lines with the most Search Console impressions/clicks (updated from Search Console). */
const SEARCH_PRIORITY_LINES = [
  "n80",
  "c30",
  "e3",
  "n65",
  "n62",
  "x30",
  "c18",
  "806",
  "cv5",
  "b7",
  "l16",
  "n81",
  "648",
  "c20",
  "c19",
  "808",
  "805",
  "c10",
  "pr3",
  "n67",
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

/** SERP copy aligned with queries like "n80", "c19 bus", "moventis temps real". */
export function buildLinePageSeo(lineName: string): LinePageSeo {
  const line = lineName.toUpperCase();
  return {
    title: `Bus ${line} temps real i tiempo real · Moventis`,
    description: `Consulta el bus ${line} de Moventis en temps real (tiempo real): properes arribades, parades al mapa i horaris actualitzats de la línia ${line}.`,
  };
}

export function buildHomePageSeo(): HomePageSeo {
  return {
    title: "Moventis temps real i tiempo real | QuanTriga",
    description:
      "Consulta Moventis en temps real i tiempo real: mapa de parades, properes arribades i línies N80, C30, E3, N65, N62, X30, C18 i 806.",
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
