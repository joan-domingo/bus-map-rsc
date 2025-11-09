import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { CustomBusLineTimetable } from "../../types";
import MarkerTimetable from "../MarkerTimetable";

describe("MarkerTimetable", () => {
  const mockTimetableData: CustomBusLineTimetable[] = [
    {
      lineId: 12,
      lineName: "A4 - A4-SANT CUGAT DEL VALLÈS - BARCELONA",
      nextBuses: [
        {
          minutesLeft: "14 min 19 seg",
          name: "Barcelona",
          real: true,
        },
        {
          minutesLeft: "25 min 30 seg",
          name: "Barcelona",
          real: false,
        },
      ],
    },
    {
      lineId: 15,
      lineName: "B2 - B2-SABADELL - RIPOLLET",
      nextBuses: [
        {
          minutesLeft: "06 min 48 seg",
          name: "Ripollet pel Taulí",
          real: true,
        },
      ],
    },
  ];

  it("renders nothing when not visible", () => {
    const { container } = render(
      <MarkerTimetable
        selectedStopTimetable={mockTimetableData}
        isLoading={false}
        isLoaded={true}
        visible={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows loading spinner when loading", () => {
    const { container } = render(
      <MarkerTimetable
        selectedStopTimetable={[]}
        isLoading={true}
        isLoaded={false}
        visible={true}
      />,
    );

    const loadingContainer = container.querySelector(
      ".flex.flex-1.items-center.justify-center.p-2.text-black",
    );
    expect(loadingContainer).toBeVisible();

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeVisible();
  });

  it("shows error message when loaded but no data", () => {
    const { getByText } = render(
      <MarkerTimetable
        selectedStopTimetable={null as any}
        isLoading={false}
        isLoaded={true}
        visible={true}
      />,
    );

    expect(
      getByText(
        "No s'han pogut carregar les dades. Si us plau, torna-ho a intentar més tard.",
      ),
    ).toBeVisible();
  });

  it("shows no buses message when empty timetable", () => {
    render(
      <MarkerTimetable
        selectedStopTimetable={[]}
        isLoading={false}
        isLoaded={true}
        visible={true}
      />,
    );

    expect(screen.getByText("Cap autobús previst properament.")).toBeVisible();
  });

  it("renders timetable data correctly", () => {
    render(
      <MarkerTimetable
        selectedStopTimetable={mockTimetableData}
        isLoading={false}
        isLoaded={true}
        visible={true}
      />,
    );

    // Check line names are displayed
    expect(
      screen.getByText("A4 - A4-SANT CUGAT DEL VALLÈS - BARCELONA"),
    ).toBeVisible();
    expect(screen.getByText("B2 - B2-SABADELL - RIPOLLET")).toBeVisible();

    // Check bus times are displayed
    expect(screen.getByText("14 min 19 seg")).toBeVisible();
    expect(screen.getByText("25 min 30 seg")).toBeVisible();
    expect(screen.getByText("06 min 48 seg")).toBeVisible();

    // Check destinations are displayed (there are multiple "Barcelona" destinations)
    const barcelonaDestinations = screen.getAllByText("- Direcció Barcelona");
    expect(barcelonaDestinations).toHaveLength(2);
    expect(barcelonaDestinations[0]).toBeVisible();
    expect(barcelonaDestinations[1]).toBeVisible();

    expect(screen.getByText("- Direcció Ripollet pel Taulí")).toBeVisible();
  });

  it("applies alternating background colors", () => {
    const { container } = render(
      <MarkerTimetable
        selectedStopTimetable={mockTimetableData}
        isLoading={false}
        isLoaded={true}
        visible={true}
      />,
    );

    const infoContainers = container.querySelectorAll(
      ".flex.flex-col.flex-1.p-1.text-black",
    );

    expect(infoContainers).toHaveLength(2);

    // First container (index 0) should have gray background
    expect(infoContainers[0].classList.contains("bg-gray-100")).toBe(true);

    // Second container (index 1) should not have gray background
    expect(infoContainers[1].classList.contains("bg-gray-100")).toBe(false);
  });

  it("displays correct number of bus entries per line", () => {
    const { container } = render(
      <MarkerTimetable
        selectedStopTimetable={mockTimetableData}
        isLoading={false}
        isLoaded={true}
        visible={true}
      />,
    );

    // Find all bus time entries (elements with flex display style)
    const busEntries = container.querySelectorAll(
      'div[style*="display: flex"]',
    );

    // Should have 3 bus entries total (2 for A4 line, 1 for B2 line)
    expect(busEntries).toHaveLength(3);
  });

  it("handles single line with multiple buses", () => {
    const singleLineTimetable: CustomBusLineTimetable[] = [
      {
        lineId: 299,
        lineName: "e3 - E3-BARCELONA - CERDANYOLA - UAB",
        nextBuses: [
          {
            minutesLeft: "01 min 51 seg",
            name: "Barcelona",
            real: true,
          },
          {
            minutesLeft: "20 min 47 seg",
            name: "Barcelona",
            real: true,
          },
          {
            minutesLeft: "31 min 07 seg",
            name: "Barcelona",
            real: true,
          },
        ],
      },
    ];

    const { getByText, container } = render(
      <MarkerTimetable
        selectedStopTimetable={singleLineTimetable}
        isLoading={false}
        isLoaded={true}
        visible={true}
      />,
    );

    expect(getByText("e3 - E3-BARCELONA - CERDANYOLA - UAB")).toBeVisible();
    expect(getByText("01 min 51 seg")).toBeVisible();
    expect(getByText("20 min 47 seg")).toBeVisible();
    expect(getByText("31 min 07 seg")).toBeVisible();

    const busEntries = container.querySelectorAll(
      'div[style*="display: flex"]',
    );
    expect(busEntries).toHaveLength(3);
  });
});
