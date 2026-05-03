import busLineData from "./busLineData.json";

const SEARCH_PRIORITY_LINES = ["e3", "n61"] as const;

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
