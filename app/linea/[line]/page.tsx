import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LineStopsSection } from "../../../lib/components/LineStopsSection";
import { LineStructuredData } from "../../../lib/components/LineStructuredData";
import { STOPS_SHEET_PEEK } from "../../../lib/components/lineStopsSheet";
import { MapContainer } from "../../../lib/components/MapContainer";
import {
  loadAllBusStops,
  loadBusStopsForLineIds,
} from "../../../lib/data-loader";
import { buildOgImageAlt, OG_IMAGE_SIZE } from "../../../lib/og/og-image";
import {
  buildLineOgImagePath,
  buildLinePagePath,
  buildLinePageSeo,
  resolveLineSlug,
} from "../../../lib/utils/seo";

export const dynamic = "force-dynamic";

/**
 * The stop sheet docks over the bottom of the screen, so the map stops exactly
 * where the sheet's header begins. That keeps the Moventis attribution, which
 * sits at the foot of the map, from being covered.
 */
const MAP_HEIGHT = `calc(100dvh - ${STOPS_SHEET_PEEK})`;

interface LinePageProps {
  params: Promise<{
    line: string;
  }>;
}

export async function generateMetadata({
  params,
}: LinePageProps): Promise<Metadata> {
  const { line } = await params;
  const resolved = resolveLineSlug(line);

  if (!resolved) {
    return {
      title: "Línia no trobada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { canonicalSlug, lineName: canonicalLineName } = resolved;
  const basePath = buildLinePagePath(canonicalSlug);
  const { title: seoTitle, description: seoDescription } =
    buildLinePageSeo(canonicalLineName);
  const ogImage = {
    url: buildLineOgImagePath(canonicalSlug),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt: buildOgImageAlt(canonicalLineName),
  };

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: basePath,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: basePath,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      title: seoTitle,
      description: seoDescription,
      card: "summary_large_image",
      images: [ogImage.url],
    },
  };
}

export default async function LinePage({ params }: LinePageProps) {
  const { line } = await params;
  const resolved = resolveLineSlug(line);

  if (!resolved) {
    notFound();
  }

  if (resolved.canonicalSlug !== line.toLowerCase()) {
    redirect(buildLinePagePath(resolved.canonicalSlug));
  }

  const { canonicalSlug, lineName: canonicalLineName, lineStopIds } = resolved;
  const [allBusStops, lineBusStops] = await Promise.all([
    loadAllBusStops(),
    loadBusStopsForLineIds(lineStopIds),
  ]);
  const busStopsById = new Map(allBusStops.map((stop) => [stop.id, stop]));

  for (const lineStop of lineBusStops) {
    const existingStop = busStopsById.get(lineStop.id);
    if (existingStop) {
      existingStop.buses = Array.from(
        new Set([...existingStop.buses, ...lineStop.buses]),
      );
      continue;
    }

    busStopsById.set(lineStop.id, lineStop);
  }

  const busStops = Array.from(busStopsById.values());
  const basePath = buildLinePagePath(canonicalSlug);

  return (
    <div className="h-dvh w-screen relative">
      <div className="relative w-screen" style={{ height: MAP_HEIGHT }}>
        <LineStructuredData lineName={canonicalLineName} path={basePath} />
        <nav
          aria-label="Navegació línies de bus"
          className="absolute right-2 bottom-10 z-10 rounded-md bg-white/90 px-3 py-2 text-xs text-black shadow"
        >
          <a className="underline" href="/">
            Veure totes les línies
          </a>
        </nav>
        <MapContainer
          allBusStops={busStops}
          lineFilter={{ lineStopIds, lineName: canonicalLineName }}
          mapHeight={MAP_HEIGHT}
        />
      </div>
      <LineStopsSection lineName={canonicalLineName} stops={lineBusStops} />
    </div>
  );
}
