const busLinesEndpoint = "https://www.moventis.es/es/moventis/ca/lines";

interface MoventisBusLine {
  nid: string;
  ID_LINEA: string;
  COD_LINEA: string;
  DESC_LINEA: string;
  ID_ZONA: string;
  ID_SUBZONA: string;
  TREAL: "S" | "N";
  FORMA: "redondo" | "cuadrado";
  COLOR: string;
  ADAPTADA: "S" | "N";
  MARCA: string;
  DIAS_QUE_CIRCULA: string;
}

try {
  console.log("Downloading all bus lines data...");
  // fetch data
  const response = await fetch(busLinesEndpoint);
  const busLinesDataResponseList = await response.json();

  // Map data
  const busLinesData: Record<string, MoventisBusLine> = {};
  for (const line of busLinesDataResponseList) {
    // Create a dictionary with the bus line ID as the key
    busLinesData[line.ID_LINEA] = line;
  }

  // store data
  await Bun.write("data/bus-lines.json", JSON.stringify(busLinesData, null, 2));

  const busLinesInfoList = Object.values(busLinesData);

  // Download bus line stops, line by line
  for (let i = 0; i < busLinesInfoList.length; i++) {
    const busLineInfo = busLinesInfoList[i];

    console.log(
      `Downloading ${busLineInfo.COD_LINEA} (${busLineInfo.ID_LINEA}) bus line stops...`,
    );
    const response = await fetch(
      `https://www.moventis.es/api/json/GetTrayectos/${busLineInfo.ID_LINEA}/${busLineInfo.DIAS_QUE_CIRCULA}`,
    );
    const body = await response.json();

    await Bun.write(
      `data/${busLineInfo.ID_LINEA}.json`,
      JSON.stringify(body, null, 2),
    );
  }

  // Convert data to something useful
  // Only one list of bus stops per bus line
  for (let i = 0; i < busLinesInfoList.length; i++) {
    const busLineInfo = busLinesInfoList[i];
    console.log(`Preparing ${busLineInfo.ID_LINEA} bus line stops...`);

    const linesArray = await Bun.file(
      `data/${busLineInfo.ID_LINEA}.json`,
    ).text();

    const busLineStops = JSON.parse(linesArray).flatMap(
      (item: any) => item.TrayectosDet,
    );

    // Remove duplicates from busLineStops
    const uniqueStops = new Map();
    for (const stop of busLineStops) {
      if (!stop?.ID_PARADA) continue; // Skip if ID_PARADA is not present
      uniqueStops.set(stop.ID_PARADA, stop);
    }
    const busLineStopsArray = Array.from(uniqueStops.values());

    await Bun.write(
      `public/stops/${busLineInfo.ID_LINEA}.json`,
      JSON.stringify(busLineStopsArray, null, 2),
    );
  }

  // Create a file with all bus stops
  console.log("Preparing all bus stops...");
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let allBusStops: any[] = [];

  for (let i = 0; i < busLinesInfoList.length; i++) {
    const busLineInfo = busLinesInfoList[i];

    const busLineStops = await Bun.file(
      `public/stops/${busLineInfo.ID_LINEA}.json`,
    ).text();
    allBusStops = [...allBusStops, ...JSON.parse(busLineStops)];
  }

  // Remove duplicates from all bus stops data
  const uniqueStops = new Map();
  for (const stop of allBusStops) {
    uniqueStops.set(stop.ID_PARADA, stop);
  }
  const uniqueBusLineStopsArray = Array.from(uniqueStops.values());

  // Add new field with all the buses that stop at that stop
  for (const stop of uniqueBusLineStopsArray) {
    stop.buses = [];
    for (const busLine of busLinesInfoList) {
      const lineStops = await Bun.file(
        `public/stops/${busLine.ID_LINEA}.json`,
      ).text();
      const lineStopsArray = JSON.parse(lineStops);
      if (lineStopsArray.some((s: any) => s.ID_PARADA === stop.ID_PARADA)) {
        stop.buses.push(busLine.ID_LINEA);
      }
    }
  }

  // Reduce the array to only the necessary fields
  const busLineStopsArray = uniqueBusLineStopsArray.map((stop) => ({
    id: stop.ID_PARADA,
    name: stop.Parada.DESC_PARADA,
    lat: stop.Parada.LATITUD,
    lon: stop.Parada.LONGITUD,
    buses: stop.buses,
    lineId: stop.ID_LINEA,
    zoneId: stop.Parada.ID_ZONA,
  }));

  // Write the final data to a file (compressed)
  const jsonContent = JSON.stringify(busLineStopsArray, null, 2);
  const { gzipSync } = await import("node:zlib");
  const compressed = gzipSync(Buffer.from(jsonContent));
  await Bun.write("public/stops/all.json.gz", compressed);
  console.log("All bus lines data downloaded and prepared successfully.");

  // Create a dictionary with bus line ID as the key and the bus line name and the color as values
  // and save it to a file
  const busLineColors: Record<string, { name: string; color: string }> = {};
  for (const busLine of busLinesInfoList) {
    busLineColors[busLine.ID_LINEA] = {
      name: busLine.COD_LINEA,
      color: busLine.COLOR,
    };
  }

  await Bun.write(
    "lib/utils/busLineData.json",
    JSON.stringify(busLineColors, null, 2),
  );
} catch (err) {
  console.error("Error:", err);
}
export {};
