import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapContainer } from "../../../lib/components/MapContainer";
import { loadAllBusStops } from "../../../lib/data-loader";
import { LineStructuredData } from "../../../lib/components/LineStructuredData";
import { buildOgImageAlt, OG_IMAGE_SIZE } from "../../../lib/og/og-image";
import {
  buildLinePageSeo,
  getCanonicalLineName,
  getLineIdsBySlug,
  getLineOgImagePath,
} from "../../../lib/utils/seo";

export const dynamic = "force-dynamic";

interface LinePageProps {
  params: Promise<{
    line: string;
  }>;
}

export async function generateMetadata({
  params,
}: LinePageProps): Promise<Metadata> {
  const { line } = await params;
  const canonicalLineName = getCanonicalLineName(line);

  if (!canonicalLineName) {
    return {
      title: "Línia no trobada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const lineSlug = line.toLowerCase();
  const basePath = `/linea/${lineSlug}`;
  const { title: seoTitle, description: seoDescription } =
    buildLinePageSeo(canonicalLineName);
  const ogImage = {
    url: getLineOgImagePath(lineSlug),
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
  const lineStopIds = getLineIdsBySlug(line);

  if (lineStopIds.length === 0) {
    notFound();
  }

  const canonicalLineName = getCanonicalLineName(line);
  if (!canonicalLineName) {
    notFound();
  }

  const busStops = await loadAllBusStops();

  const basePath = `/linea/${line.toLowerCase()}`;

  return (
    <div className="h-screen w-screen relative">
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
      />
    </div>
  );
}
