import { describe, expect, it } from "bun:test";
import type { BusStop } from "../../types";
import { filterBusStops } from "../filterBusStops";

const stops: BusStop[] = [
  {
    id: 1,
    name: "Parada 1",
    lat: 41.5,
    lon: 2.1,
    buses: ["1"],
    lineId: 1,
    zoneId: 3,
  },
  {
    id: 2,
    name: "Parada 2",
    lat: 41.6,
    lon: 2.2,
    buses: ["68"],
    lineId: 68,
    zoneId: 3,
  },
  {
    id: 3,
    name: "Parada 3",
    lat: 41.7,
    lon: 2.3,
    buses: ["1", "68"],
    lineId: 1,
    zoneId: 3,
  },
];

describe("filterBusStops", () => {
  it("filters to stops served by the highlighted line", () => {
    expect(
      filterBusStops(
        stops,
        { lineStopIds: ["68"], lineName: "N80" },
        false,
        new Set(),
      ).map((stop) => stop.id),
    ).toEqual([2, 3]);
  });

  it("combines the line filter with starred stops", () => {
    expect(
      filterBusStops(
        stops,
        { lineStopIds: ["68"], lineName: "N80" },
        true,
        new Set([1, 3]),
      ).map((stop) => stop.id),
    ).toEqual([3]);
  });

  it("returns all stops when neither filter is active", () => {
    expect(filterBusStops(stops, undefined, false, new Set())).toEqual(stops);
  });
});
