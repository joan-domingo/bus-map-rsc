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

function normalizeLineName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9.]/g, "");
}

export interface SeoLineEntry {
  slug: string;
  name: string;
}

export function getAllLineSlugs(): string[] {
  const slugSet = new Set<string>();

  for (const lineData of Object.values(busLineData)) {
    const slug = normalizeLineName(lineData.name);
    if (slug) {
      slugSet.add(slug);
    }
  }

  return [...slugSet].sort();
}

export function getAllSeoLineEntries(): SeoLineEntry[] {
  const lineMap = new Map<string, string>();

  for (const lineData of Object.values(busLineData)) {
    const slug = normalizeLineName(lineData.name);
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
  const normalizedSlug = normalizeLineName(slug);

  return Object.entries(busLineData)
    .filter(([, data]) => normalizeLineName(data.name) === normalizedSlug)
    .map(([lineStopId]) => lineStopId);
}

export function getCanonicalLineName(slug: string): string | null {
  const lineStopIds = getLineIdsBySlug(slug);
  if (lineStopIds.length === 0) {
    return null;
  }

  const firstLineStopId = lineStopIds[0];
  const lineData = busLineData[firstLineStopId as keyof typeof busLineData];
  return lineData?.name ?? null;
}

export function getPriorityLineSlugs(): string[] {
  return [...SEARCH_PRIORITY_LINES];
}
