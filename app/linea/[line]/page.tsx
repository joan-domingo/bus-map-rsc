import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MapContainer } from "../../../lib/components/MapContainer";
import { loadAllBusStops } from "../../../lib/data-loader";
import { LineStructuredData } from "../../../lib/components/LineStructuredData";
import { buildOgImageAlt, OG_IMAGE_SIZE } from "../../../lib/og/og-image";
import {
  buildLinePagePath,
  buildLinePageSeo,
  buildLineOgImagePath,
  resolveLineSlug,
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
  const busStops = await loadAllBusStops();
  const basePath = buildLinePagePath(canonicalSlug);

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
