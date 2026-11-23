import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMapStore } from "../../store/useMapStore";
import { useStarredStops } from "../../store/useStarredStops";
import type {
  BusLineStopTimetable,
  BusStop,
  CustomBusLineTimetable,
} from "../../types";
import { StopDeparturesSheet } from "../StopDeparturesSheet";

const stop: BusStop = {
  id: 200071,
  name: "Av. Primavera - Les Fontetes",
  lat: 41.5,
  lon: 2.1,
  buses: ["12", "15"],
  lineId: 12,
  zoneId: 3,
};

const timetable: CustomBusLineTimetable[] = [
  {
    lineId: 12,
    lineName: "A4 - SANT CUGAT DEL VALLÈS - BARCELONA",
    nextBuses: [
      { minutesLeft: "10 min", name: "Barcelona", real: true },
      { minutesLeft: "27 min", name: "Barcelona", real: true },
      { departureTime: "14:56", name: "Sabadell", real: false },
      { departureTime: "15:26", name: "Sabadell", real: false },
      { departureTime: "15:56", name: "Sabadell", real: false },
    ],
  },
];

const originalFetch = globalThis.fetch;

function renderSheet(onClose = mock()) {
  return {
    ...render(<StopDeparturesSheet stop={stop} onClose={onClose} />),
    onClose,
  };
}

describe("StopDeparturesSheet", () => {
  beforeEach(() => {
    useMapStore.setState({
      selectedStopTimetable: timetable,
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: true,
      selectedStopTimetableError: null,
      selectedStopTimetableUpdatedAt: Date.now(),
    });
    useStarredStops.setState({
      starredStopIdsArray: [],
      showOnlyStarred: false,
    });
    window.gtag = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    window.gtag = undefined;
    localStorage.clear();
  });

  it("shows the selected stop and its upcoming live and scheduled arrivals", () => {
    renderSheet();

    expect(
      screen.getByRole("heading", { name: "Av. Primavera - Les Fontetes" }),
    ).toBeVisible();
    expect(screen.getByText("Parada 200071")).toBeVisible();
    expect(screen.getByText("10 min")).toBeVisible();
    expect(screen.getByText("14:56")).toBeVisible();
    expect(screen.getAllByText("En temps real")).toHaveLength(2);
    expect(screen.getAllByText("Horari")).toHaveLength(2);
    expect(screen.getByText(/Actualitzat a/)).toBeVisible();
  });

  it("keeps the arrivals scrollable and the show-all button below them", () => {
    renderSheet();

    const arrivals = screen.getByRole("region", { name: "Properes arribades" });
    const showAllButton = screen.getByRole("button", {
      name: "Veure tots els horaris",
    });

    expect(arrivals).toHaveClass("min-h-0", "overflow-y-auto");
    expect(arrivals).not.toContainElement(showAllButton);
    expect(arrivals.parentElement).toHaveStyle({
      paddingBottom: "calc(3rem + env(safe-area-inset-bottom, 0px))",
    });
  });

  it("expands to show the full timetable", async () => {
    renderSheet();

    expect(screen.queryByText("15:56")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Veure tots els horaris" }),
    );

    expect(screen.getByText("15:56")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Mostra menys" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the sheet from its close button", async () => {
    const { onClose } = renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Tanca els horaris de la parada" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stars the stop and tracks the action", async () => {
    const gtag = mock();
    window.gtag = gtag;
    renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Afegir als preferits" }),
    );

    expect(useStarredStops.getState().starredStopIdsArray).toEqual([stop.id]);
    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "bus_stop_star",
      {
        stop_id: stop.id,
        stop_name: stop.name,
        action: "star",
        bus_lines: "12,15",
      },
    ]);
  });

  it("refreshes the selected stop's timetable", async () => {
    const response: BusLineStopTimetable[] = [];
    const fetchMock = mock(
      async (_input: RequestInfo | URL) =>
        new Response(JSON.stringify(response), {
          headers: { "Content-Type": "application/json" },
        }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    renderSheet();

    await userEvent.click(
      screen.getByRole("button", { name: "Actualitza les arribades" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock.mock.calls[0]?.[0]?.toString()).toContain(
      `/GetTiemposParada/es/${stop.id}/${stop.lineId}/${stop.zoneId}`,
    );
  });
});
