import { beforeEach, describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { mapsMock, resetMapsMock } from "../../../test/googleMapsMock";
import { UserLocationMarker } from "../UserLocationMarker";

describe("UserLocationMarker", () => {
  beforeEach(resetMapsMock);

  it("places a marker at the user location above every bus stop", () => {
    render(<UserLocationMarker location={{ lat: 41.49, lng: 2.14 }} />);

    expect(screen.getByTestId("advanced-marker")).toBeInTheDocument();
    expect(mapsMock.props.AdvancedMarker).toMatchObject({
      position: { lat: 41.49, lng: 2.14 },
      zIndex: 1000,
    });
  });

  it("renders the blue dot", () => {
    render(<UserLocationMarker location={{ lat: 0, lng: 0 }} />);

    const dot = screen.getByTestId("advanced-marker").firstElementChild;
    expect(dot).toHaveStyle({
      backgroundColor: "#4285F4",
      borderRadius: "50%",
    });
  });
});
