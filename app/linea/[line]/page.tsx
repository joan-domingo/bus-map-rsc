import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapContainer } from "../../../lib/components/MapContainer";
import { loadAllBusStops } from "../../../lib/data-loader";
import {
  getAllLineSlugs,
  getCanonicalLineName,
  getLineIdsBySlug,
} from "../../../lib/utils/seo";

interface LinePageProps {
  params: Promise<{
    line: string;
  }>;
}

export async function generateStaticParams() {
  return getAllLineSlugs().map((line) => ({ line }));
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

  const basePath = `/linea/${line.toLowerCase()}`;
  const seoTitle = `Moventis ${canonicalLineName} en temps real`;
  const seoDescription = `Consulta la línia ${canonicalLineName} de Moventis en temps real: properes arribades, parades i mapa actualitzat.`;

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
    },
    twitter: {
      title: seoTitle,
      description: seoDescription,
      card: "summary_large_image",
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

  return (
    <div className="h-screen w-screen relative">
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
