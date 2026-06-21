import type { Metadata } from "next";
import { MapContainer } from "../lib/components/MapContainer";
import { loadAllBusStops } from "../lib/data-loader";
import {
  buildHomePageSeo,
  buildLinePagePath,
  getVisiblePriorityLineSlugs,
} from "../lib/utils/seo";

const homeSeo = buildHomePageSeo();

export const metadata: Metadata = {
  title: homeSeo.title,
  description: homeSeo.description,
};

export default async function Home() {
  // This runs on the server
  const busStops = await loadAllBusStops();
  const priorityLineSlugs = getVisiblePriorityLineSlugs();

  return (
    <div className="h-dvh w-screen relative">
      <nav
        aria-label="Línies de bus més buscades"
        className="absolute right-2 left-2 z-10 rounded-md bg-white/90 px-2 py-2 text-[11px] leading-5 text-black shadow sm:left-auto sm:max-w-[32rem] sm:px-3 sm:text-xs"
        style={{ bottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <span className="font-semibold">Més buscades: </span>
        {priorityLineSlugs.map((line, index) => (
          <span key={line}>
            <a className="underline" href={buildLinePagePath(line)}>
              {line.toUpperCase()}
            </a>
            {index < priorityLineSlugs.length - 1 ? ", " : ""}
          </span>
        ))}
        <span>
          {" · "}
          <a className="underline" href="/linies">
            Totes les línies
          </a>
        </span>
      </nav>
      <MapContainer allBusStops={busStops} />
    </div>
  );
}
