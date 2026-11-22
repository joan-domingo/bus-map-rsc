import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mapsMock, resetMapsMock } from "../../../test/googleMapsMock";
import type { BusStop } from "../../types";
import { BusStopMarker } from "../BusStopMarker";

const stop: BusStop = {
  id: 42,
  name: "Plaça de Sant Ramon",
  lat: 41.4912,
  lon: 2.1403,
  buses: ["1", "53"],
  lineId: 1,
  zoneId: 3,
};

function renderMarker(selected = false) {
  const onClick = mock();
  return {
    ...render(
      <BusStopMarker onClick={onClick} selected={selected} stop={stop} />,
    ),
    onClick,
  };
}

describe("BusStopMarker", () => {
  beforeEach(() => {
    resetMapsMock();
  });

  it("anchors the marker at the stop coordinates and labels it", () => {
    renderMarker();

    expect(mapsMock.props.AdvancedMarker).toMatchObject({
      position: { lat: 41.4912, lng: 2.1403 },
      title: "Plaça de Sant Ramon",
      zIndex: 0,
    });
  });

  it("raises a selected stop above the other markers", () => {
    renderMarker(true);

    expect(mapsMock.props.AdvancedMarker).toMatchObject({ zIndex: 1 });
  });

  it("renders a colored badge for each served line", () => {
    renderMarker();

    expect(screen.getByText("C1")).toHaveStyle({
      backgroundColor: "#F70046",
      color: "#ffffff",
    });
    expect(screen.getByText("C10")).toHaveStyle({
      backgroundColor: "#9AFF1F",
      color: "#000000",
    });
  });

  it("forwards marker clicks", async () => {
    const { onClick } = renderMarker();

    await userEvent.click(screen.getByTestId("advanced-marker"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
