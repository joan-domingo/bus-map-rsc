import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CustomBusLineTimetable } from "../../types";
import MarkerTimetable from "../MarkerTimetable";

const mockTimetableData: CustomBusLineTimetable[] = [
  {
    lineId: 12,
    lineName: "A4 - A4-SANT CUGAT DEL VALLÈS - BARCELONA",
    nextBuses: [
      { minutesLeft: "14 min", name: "Barcelona", real: true },
      { departureTime: "14:56", name: "Barcelona", real: false },
    ],
  },
  {
    lineId: 15,
    lineName: "B2 - B2-SABADELL - RIPOLLET",
    nextBuses: [
      { minutesLeft: "6 min", name: "Ripollet pel Taulí", real: true },
    ],
  },
];

function renderTimetable(
  overrides: Partial<Parameters<typeof MarkerTimetable>[0]> = {},
) {
  const props = {
    selectedStopTimetable: mockTimetableData,
    isLoading: false,
    isLoaded: true,
    error: null,
    expanded: true,
    onRetry: mock(),
    ...overrides,
  };

  return { ...render(<MarkerTimetable {...props} />), props };
}

function getClockTimeAfter(minutes: number): string {
  const date = new Date(Date.now() + minutes * 60_000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

describe("MarkerTimetable", () => {
  it("shows a loading status while arrivals are being fetched", () => {
    renderTimetable({ isLoading: true, isLoaded: false });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregant properes arribades",
    );
  });

  it("shows an error and retry action when loading fails", async () => {
    const { props } = renderTimetable({
      error: "Network error",
      isLoaded: true,
      selectedStopTimetable: null,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No s'han pogut carregar les dades",
    );
    await screen.getByRole("button", { name: "Torna-ho a provar" }).click();
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when no buses are scheduled", () => {
    renderTimetable({ selectedStopTimetable: [] });

    expect(screen.getByText("Cap autobús previst properament.")).toBeVisible();
  });

  it("renders line, direction, ETA, and live-versus-scheduled status", () => {
    renderTimetable();

    expect(
      screen.getByText("A4 - A4-SANT CUGAT DEL VALLÈS - BARCELONA"),
    ).toBeVisible();
    expect(screen.getAllByText("Barcelona")).toHaveLength(2);
    expect(screen.getByText("14 min")).toBeVisible();
    expect(screen.getByText("14:56")).toBeVisible();
    expect(screen.getAllByText("En temps real")).toHaveLength(2);
    expect(screen.getByText("Horari")).toBeVisible();
  });

  it("links known lines and keeps unknown lines as plain text", () => {
    const { rerender } = renderTimetable();

    expect(
      screen
        .getByRole("link", {
          name: /A4 - A4-SANT CUGAT DEL VALLÈS - BARCELONA/,
        })
        .getAttribute("href"),
    ).toBe("/linia/a4");

    rerender(
      <MarkerTimetable
        selectedStopTimetable={[
          {
            lineId: 999999,
            lineName: "ZZ - LÍNIA DESCONEGUDA",
            nextBuses: [{ minutesLeft: "5 min", name: "Enlloc", real: true }],
          },
        ]}
        isLoading={false}
        isLoaded={true}
        error={null}
        expanded={true}
        onRetry={mock()}
      />,
    );

    expect(screen.getByText("ZZ - LÍNIA DESCONEGUDA").tagName).toBe("SPAN");
  });

  it("sorts the collapsed view by arrival time across lines and limits it to four", () => {
    renderTimetable({
      expanded: false,
      selectedStopTimetable: [
        {
          lineId: 12,
          lineName: "A4",
          nextBuses: [
            { minutesLeft: "14 min", name: "Later", real: true },
            {
              departureTime: getClockTimeAfter(8),
              name: "Clock scheduled",
              real: false,
            },
          ],
        },
        {
          lineId: 15,
          lineName: "B2",
          nextBuses: [
            { minutesLeft: "1 min", name: "Soonest", real: true },
            { minutesLeft: "4 min", name: "Second", real: true },
            {
              departureTime: "6 min",
              name: "Relative scheduled",
              real: false,
            },
            { minutesLeft: "12 min", name: "Not shown", real: true },
          ],
        },
      ],
    });

    const visibleDepartures = screen.getAllByRole("listitem");
    expect(visibleDepartures).toHaveLength(4);
    expect(visibleDepartures[0]).toHaveTextContent("Soonest");
    expect(visibleDepartures[1]).toHaveTextContent("Second");
    expect(visibleDepartures[2]).toHaveTextContent(/Relative scheduled/i);
    expect(visibleDepartures[3]).toHaveTextContent(/Clock scheduled/i);
    expect(screen.queryByText("Later")).toBeNull();
    expect(screen.queryByText("Not shown")).toBeNull();
  });

  it("sorts hour-long realtime arrivals in the collapsed view", () => {
    renderTimetable({
      expanded: false,
      selectedStopTimetable: [
        {
          lineId: 12,
          lineName: "A4",
          nextBuses: [
            { minutesLeft: "2 h", name: "Later", real: true },
            { minutesLeft: "1 h 34 min", name: "Middle", real: true },
            { minutesLeft: "58 min", name: "Sooner", real: true },
            { minutesLeft: "1 h 4 min", name: "Closer", real: true },
          ],
        },
      ],
    });

    const visibleDepartures = screen.getAllByRole("listitem");
    expect(visibleDepartures).toHaveLength(4);
    expect(visibleDepartures[0]).toHaveTextContent("Sooner");
    expect(visibleDepartures[1]).toHaveTextContent("Closer");
    expect(visibleDepartures[2]).toHaveTextContent("Middle");
    expect(visibleDepartures[3]).toHaveTextContent("Later");
    expect(screen.getByText("1 h 4 min")).toBeVisible();
    expect(screen.getByText("1 h 34 min")).toBeVisible();
    expect(screen.getByText("2 h")).toBeVisible();
  });

  it("shows short terminal names when collapsed and full destinations when expanded", () => {
    const selectedStopTimetable: CustomBusLineTimetable[] = [
      {
        lineId: 12,
        lineName: "A4 - SANT CUGAT DEL VALLÈS - BARCELONA",
        nextBuses: [
          { minutesLeft: "4 min", name: "Sant Cugat", real: true },
          {
            departureTime: "19:40",
            name: "BARCELONA - SANT CUGAT DEL VALLÈS",
            real: false,
          },
        ],
      },
      {
        lineId: 15,
        lineName: "B2 - SABADELL - RIPOLLET",
        nextBuses: [
          { minutesLeft: "6 min", name: "Sabadell pel Taulí", real: true },
          {
            departureTime: "19:41",
            name: "RIPOLLET - PARC TAULÍ - SABADELL",
            real: false,
          },
        ],
      },
    ];
    const { props, rerender } = renderTimetable({
      expanded: false,
      selectedStopTimetable,
    });

    expect(screen.getAllByText("Sant Cugat")).toHaveLength(2);
    expect(screen.getAllByText("Sabadell")).toHaveLength(2);
    expect(screen.queryByText("BARCELONA - SANT CUGAT DEL VALLÈS")).toBeNull();
    expect(screen.queryByText("RIPOLLET - PARC TAULÍ - SABADELL")).toBeNull();

    rerender(<MarkerTimetable {...props} expanded={true} />);

    expect(screen.getByText("Sant Cugat")).toBeVisible();
    expect(screen.getByText("BARCELONA - SANT CUGAT DEL VALLÈS")).toBeVisible();
    expect(screen.getByText("Sabadell pel Taulí")).toBeVisible();
    expect(screen.getByText("RIPOLLET - PARC TAULÍ - SABADELL")).toBeVisible();
  });

  it("derives the terminal from a scheduled destination when no live bus is available", () => {
    renderTimetable({
      expanded: false,
      selectedStopTimetable: [
        {
          lineId: 12,
          lineName: "A4 - SANT CUGAT DEL VALLÈS - BARCELONA",
          nextBuses: [
            {
              departureTime: "19:40",
              name: "BARCELONA - SANT CUGAT DEL VALLÈS",
              real: false,
            },
          ],
        },
      ],
    });

    expect(screen.getByText("Sant Cugat del Vallès")).toBeVisible();
  });
});
