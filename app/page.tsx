import { MapContainer } from "../lib/components/MapContainer";
import { loadAllBusStops } from "../lib/data-loader";

export default async function Home() {
  // This runs on the server
  const busStops = await loadAllBusStops();

  return (
    <div className="h-screen w-screen">
      <MapContainer allBusStops={busStops} />
    </div>
  );
}
