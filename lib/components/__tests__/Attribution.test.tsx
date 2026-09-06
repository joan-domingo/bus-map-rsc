import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Attribution } from "../Attribution";

describe("Attribution", () => {
  it("credits Moventis with a safe external link", () => {
    render(<Attribution />);

    const link = screen.getByRole("link", { name: "Moventis" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.moventis.es/ca/temps-real",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("keeps clear of the iOS home indicator", () => {
    const { container } = render(<Attribution />);

    expect(container.firstElementChild).toHaveStyle({
      paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))",
    });
  });
});
