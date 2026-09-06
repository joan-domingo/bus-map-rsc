import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mapsMock, resetMapsMock } from "../../../test/googleMapsMock";
import { useMapStore } from "../../store/useMapStore";
import { useStarredStops } from "../../store/useStarredStops";
import type { BusStop, CustomBusLineTimetable } from "../../types";
import { MarkerWithInfowindow } from "../MarkerWithInfoWindow";

const stop: BusStop = {
  id: 42,
  name: "Plaça de Sant Ramon",
  lat: 41.4912,
  lon: 2.1403,
  // "1" is C1 (#F70046) and "53" is C-10 (#9AFF1F), which need opposite labels
  buses: ["1", "53"],
  lineId: 1,
  zoneId: 3,
};

function renderMarker(
  overrides: Partial<Parameters<typeof MarkerWithInfowindow>[0]> = {},
) {
  const props = {
    stop,
    onClick: mock(),
    onCloseClick: mock(),
    visible: false,
    ...overrides,
  };
  return { ...render(<MarkerWithInfowindow {...props} />), props };
}

describe("MarkerWithInfowindow", () => {
  beforeEach(() => {
    resetMapsMock();
    useStarredStops.setState({
      starredStopIdsArray: [],
      showOnlyStarred: false,
    });
    useMapStore.setState({
      selectedStopTimetable: [],
      selectedStopTimetableIsLoading: false,
      selectedStopTimetableIsLoaded: false,
    });
    window.gtag = undefined;
  });

  afterEach(() => {
    window.gtag = undefined;
    localStorage.clear();
  });

  it("anchors the marker at the stop coordinates", () => {
    renderMarker();

    expect(mapsMock.props.AdvancedMarker).toMatchObject({
      position: { lat: 41.4912, lng: 2.1403 },
      zIndex: 0,
    });
  });

  it("raises the selected marker above the others", () => {
    renderMarker({ visible: true });

    expect(mapsMock.props.AdvancedMarker).toMatchObject({ zIndex: 1 });
  });

  it("reports a click on the marker", async () => {
    const { props } = renderMarker();

    await userEvent.click(screen.getByTestId("advanced-marker"));

    expect(props.onClick).toHaveBeenCalledTimes(1);
  });

  it("renders one badge per line, colored and labelled from busLineData", () => {
    renderMarker();

    const c1 = screen.getByText("C1");
    expect(c1).toHaveStyle({ backgroundColor: "#F70046", color: "#ffffff" });
    const c10 = screen.getByText("C10");
    // The bright lime needs black text to stay readable
    expect(c10).toHaveStyle({ backgroundColor: "#9AFF1F", color: "#000000" });
  });

  it("shrinks the badge font as the label grows", () => {
    // "457" is "L9 LLO-TOS" -> a 9-character badge label
    renderMarker({ stop: { ...stop, buses: ["1", "444", "457"] } });

    expect(screen.getByText("C1")).toHaveStyle({ fontSize: "12px" });
    expect(screen.getByText("V4.1")).toHaveStyle({ fontSize: "10px" });
    expect(screen.getByText("L9 LLOTOS")).toHaveStyle({ fontSize: "9px" });
  });

  it("lays the badges out on a square-ish grid", () => {
    const { container } = renderMarker({
      stop: { ...stop, buses: ["1", "2", "3", "4", "5"] },
    });

    // 5 badges -> 3 columns x 2 rows
    const grid = container.querySelector(".bg-black\\/70 > div");
    expect(grid?.children).toHaveLength(2);
    expect(grid?.children[0]?.children).toHaveLength(3);
    expect(grid?.children[1]?.children).toHaveLength(2);
  });

  it("keeps the info window closed until the marker is selected", () => {
    renderMarker();

    expect(screen.queryByTestId("info-window")).toBeNull();
  });

  it("shows the stop name and timetable in the info window when selected", () => {
    const timetable: CustomBusLineTimetable[] = [
      {
        lineId: 1,
        lineName: "C1",
        nextBuses: [{ name: "Barcelona", real: true, minutesLeft: "3 seg" }],
      },
    ];
    useMapStore.setState({
      selectedStopTimetable: timetable,
      selectedStopTimetableIsLoaded: true,
    });

    renderMarker({ visible: true });

    expect(screen.getByTestId("info-window")).toBeInTheDocument();
    expect(screen.getByText("Plaça de Sant Ramon")).toBeInTheDocument();
    expect(screen.getByText("- Direcció Barcelona")).toBeInTheDocument();
    expect(mapsMock.props.InfoWindow).toMatchObject({
      minWidth: 320,
      shouldFocus: true,
    });
  });

  it("closes the info window from its close button", async () => {
    const { props } = renderMarker({ visible: true });

    await userEvent.click(screen.getByRole("button", { name: "Tanca" }));

    expect(props.onCloseClick).toHaveBeenCalledTimes(1);
  });

  it("stars the stop and reports the event", async () => {
    const gtag = mock();
    window.gtag = gtag;
    renderMarker({ visible: true });

    await userEvent.click(
      screen.getByRole("button", { name: "Afegir als preferits" }),
    );

    expect(useStarredStops.getState().starredStopIdsArray).toEqual([42]);
    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "bus_stop_star",
      {
        stop_id: 42,
        stop_name: "Plaça de Sant Ramon",
        action: "star",
        bus_lines: "1,53",
      },
    ]);
    expect(
      screen.getByRole("button", { name: "Eliminar dels preferits" }),
    ).toHaveTextContent("★");
  });

  it("unstars an already starred stop and reports the event", async () => {
    const gtag = mock();
    window.gtag = gtag;
    useStarredStops.setState({ starredStopIdsArray: [42] });
    renderMarker({ visible: true });

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar dels preferits" }),
    );

    expect(useStarredStops.getState().starredStopIdsArray).toEqual([]);
    expect(gtag.mock.calls[0]?.[2]).toMatchObject({ action: "unstar" });
  });

  it("does not close the info window when the star is clicked", async () => {
    const { props } = renderMarker({ visible: true });

    await userEvent.click(
      screen.getByRole("button", { name: "Afegir als preferits" }),
    );

    expect(props.onCloseClick).not.toHaveBeenCalled();
  });
});
