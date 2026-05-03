import type { Metadata } from "next";
import { MapContainer } from "../lib/components/MapContainer";
import { loadAllBusStops } from "../lib/data-loader";
import { getPriorityLineSlugs } from "../lib/utils/seo";

export const metadata: Metadata = {
  title: "Temps real Moventis | E3, N61 i més línies",
  description:
    "Consulta Moventis en temps real: línies E3, N61 i centenars de parades amb mapa interactiu.",
};

export default async function Home() {
  // This runs on the server
  const busStops = await loadAllBusStops();
  const priorityLineSlugs = getPriorityLineSlugs();

  return (
    <div className="h-screen w-screen relative">
      <nav
        aria-label="Línies de bus més buscades"
        className="absolute right-2 bottom-10 z-10 rounded-md bg-white/90 px-3 py-2 text-xs text-black shadow"
      >
        <span className="font-semibold">Línies més buscades: </span>
        {priorityLineSlugs.map((line, index) => (
          <span key={line}>
            <a className="underline" href={`/linea/${line}`}>
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
