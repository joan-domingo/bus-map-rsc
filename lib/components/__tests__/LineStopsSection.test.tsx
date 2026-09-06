import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import type { BusStop } from "../../types";
import { LineStopsSection } from "../LineStopsSection";

function makeStops(names: string[]): BusStop[] {
  return names.map((name, index) => ({
    id: index + 1,
    name,
    lat: 41.5 + index / 1000,
    lon: 2.1 + index / 1000,
    buses: ["68"],
    lineId: 68,
    zoneId: 3,
  }));
}

const stops = makeStops(["Parc Taulí", "Estació de Sabadell", "Plaça Major"]);

const header = () =>
  screen.getByRole("button", { name: /Parades de la línia/ });
const sheet = () => screen.getByRole("region", { name: /Parades de la línia/ });

/** happy-dom lays nothing out, so the sheet is given a size to drag against. */
function sizeSheet(sheetHeight = 800, headerHeight = 72) {
  Object.defineProperty(sheet(), "offsetHeight", {
    configurable: true,
    value: sheetHeight,
  });
  Object.defineProperty(header(), "offsetHeight", {
    configurable: true,
    value: headerHeight,
  });
  return sheetHeight - headerHeight;
}

function drag(from: number, to: number) {
  fireEvent.pointerDown(header(), { clientY: from, pointerId: 1 });
  fireEvent.pointerMove(header(), { clientY: to, pointerId: 1 });
  fireEvent.pointerUp(header(), { clientY: to, pointerId: 1 });
}

describe("LineStopsSection", () => {
  describe("the stop list as search-visible content", () => {
    // The whole point of the section: if the list is only mounted once the
    // sheet is open, it leaves the HTML and the line page goes back to having
    // no crawlable text at all.
    it("renders every stop name while the sheet is still docked", () => {
      render(<LineStopsSection lineName="B2" stops={stops} />);

      expect(header()).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent),
      ).toEqual(["Parc Taulí", "Estació de Sabadell", "Plaça Major"]);
    });

    it("ships the stop names in the server-rendered HTML", () => {
      const html = renderToStaticMarkup(
        <LineStopsSection lineName="B2" stops={stops} />,
      );

      expect(html).toContain("Parc Taulí");
      expect(html).toContain("Estació de Sabadell");
      expect(html).toContain("Parades de la línia B2");
    });

    it("keeps the stops in route order", () => {
      render(
        <LineStopsSection
          lineName="B2"
          stops={makeStops(["Primera", "Segona", "Tercera"])}
        />,
      );

      expect(
        screen.getAllByRole("listitem").map((item) => item.textContent),
      ).toEqual(["Primera", "Segona", "Tercera"]);
    });

    it("describes the line in Catalan and Spanish", () => {
      const { container } = render(
        <LineStopsSection lineName="C30" stops={stops} />,
      );
      const text = container.textContent ?? "";

      expect(text).toContain("Parades de la línia C30");
      expect(text).toContain("horaris en temps real");
      expect(text).toContain("Paradas y recorrido de la línea C30");
      expect(text).toContain("horarios");
    });

    it("states how many stops the line has", () => {
      render(<LineStopsSection lineName="B2" stops={stops} />);

      expect(
        screen.getByText(/La línia B2 de Moventis té 3 parades\./),
      ).toBeInTheDocument();
    });

    it("renders nothing when the line has no stops", () => {
      const { container } = render(
        <LineStopsSection lineName="B2" stops={[]} />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("docking and expanding", () => {
    it("starts docked, showing only its header", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);

      expect(sheet()).toHaveStyle({
        transform: "translateY(calc(100% - 4.5rem))",
      });
      expect(header()).toHaveTextContent("Desplega per veure-les");
    });

    it("slides fully open when the header is tapped", async () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);

      await userEvent.click(header());

      expect(sheet()).toHaveStyle({ transform: "translateY(0)" });
      expect(header()).toHaveAttribute("aria-expanded", "true");
      expect(header()).toHaveTextContent("Tanca per veure-les");
    });

    it("docks again on a second tap", async () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);

      await userEvent.click(header());
      await userEvent.click(header());

      expect(sheet()).toHaveStyle({
        transform: "translateY(calc(100% - 4.5rem))",
      });
      expect(header()).toHaveAttribute("aria-expanded", "false");
    });

    it("docks on Escape while open", async () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      await userEvent.click(header());

      fireEvent.keyDown(window, { key: "Escape" });

      expect(header()).toHaveAttribute("aria-expanded", "false");
    });

    it("ignores Escape while already docked", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);

      fireEvent.keyDown(window, { key: "Escape" });

      expect(header()).toHaveAttribute("aria-expanded", "false");
    });

    it("keeps the docked list out of the tab order", async () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      const list = screen.getAllByRole("listitem")[0]?.closest("div");

      expect(list).toHaveAttribute("inert");

      await userEvent.click(header());
      expect(list).not.toHaveAttribute("inert");
    });
  });

  describe("dragging the header", () => {
    it("opens when dragged most of the way up", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      drag(800, 100);

      expect(header()).toHaveAttribute("aria-expanded", "true");
    });

    it("falls back to docked when barely dragged up", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      drag(800, 780);

      expect(header()).toHaveAttribute("aria-expanded", "false");
    });

    it("docks when dragged back down", async () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      await userEvent.click(header());
      sizeSheet();

      drag(100, 800);

      expect(header()).toHaveAttribute("aria-expanded", "false");
    });

    it("tracks the pointer while dragging, without animating", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      const travel = sizeSheet();

      fireEvent.pointerDown(header(), { clientY: 800, pointerId: 1 });
      fireEvent.pointerMove(header(), { clientY: 600, pointerId: 1 });

      expect(sheet()).toHaveStyle({
        transform: `translateY(${travel - 200}px)`,
        transition: "none",
      });
    });

    it("never drags past either end of its travel", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      const travel = sizeSheet();

      fireEvent.pointerDown(header(), { clientY: 800, pointerId: 1 });
      fireEvent.pointerMove(header(), { clientY: -5000, pointerId: 1 });
      expect(sheet()).toHaveStyle({ transform: "translateY(0px)" });

      fireEvent.pointerMove(header(), { clientY: 5000, pointerId: 1 });
      expect(sheet()).toHaveStyle({ transform: `translateY(${travel}px)` });
    });

    it("does not also toggle when the drag ends in a click", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      drag(800, 100);
      // A real pointer drag is followed by a click on the same element
      fireEvent.click(header());

      expect(header()).toHaveAttribute("aria-expanded", "true");
    });

    it("still toggles when the pointer never moved", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      drag(800, 800);
      fireEvent.click(header());

      expect(header()).toHaveAttribute("aria-expanded", "true");
    });

    it("settles when the pointer is cancelled mid-drag", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      fireEvent.pointerDown(header(), { clientY: 800, pointerId: 1 });
      fireEvent.pointerMove(header(), { clientY: 100, pointerId: 1 });
      fireEvent.pointerCancel(header(), { clientY: 100, pointerId: 1 });

      expect(header()).toHaveAttribute("aria-expanded", "true");
      expect(sheet()).toHaveStyle({ transform: "translateY(0)" });
    });

    it("ignores a pointer release that did not start on the header", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      fireEvent.pointerUp(header(), { clientY: 100, pointerId: 1 });

      expect(header()).toHaveAttribute("aria-expanded", "false");
      expect(sheet()).toHaveStyle({
        transform: "translateY(calc(100% - 4.5rem))",
      });
    });

    it("ignores pointer movement that did not start on the header", () => {
      render(<LineStopsSection lineName="N80" stops={stops} />);
      sizeSheet();

      fireEvent.pointerMove(header(), { clientY: 100, pointerId: 1 });

      expect(sheet()).toHaveStyle({
        transform: "translateY(calc(100% - 4.5rem))",
      });
    });
  });
});
