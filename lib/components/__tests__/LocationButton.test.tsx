import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationButton } from "../LocationButton";

describe("LocationButton", () => {
  it("renders button with correct aria label", () => {
    const onClick = mock();
    render(<LocationButton onClick={onClick} isDragging={false} />);

    const button = screen.getByLabelText("Get location");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const onClick = mock();
    const user = userEvent.setup();

    render(<LocationButton onClick={onClick} isDragging={false} />);

    const button = screen.getByLabelText("Get location");
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies opacity-50 class when isDragging is true", () => {
    const onClick = mock();
    const { container } = render(
      <LocationButton onClick={onClick} isDragging={true} />,
    );

    const button = container.querySelector("button");
    expect(button?.classList.contains("opacity-50")).toBe(true);
  });

  it("does not apply opacity-50 class when isDragging is false", () => {
    const onClick = mock();
    const { container } = render(
      <LocationButton onClick={onClick} isDragging={false} />,
    );

    const button = container.querySelector("button");
    expect(button?.classList.contains("opacity-50")).toBe(false);
  });

  it("renders SVG icon", () => {
    const onClick = mock();
    const { container } = render(
      <LocationButton onClick={onClick} isDragging={false} />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("has correct button styling classes", () => {
    const onClick = mock();
    const { container } = render(
      <LocationButton onClick={onClick} isDragging={false} />,
    );

    const button = container.querySelector("button");
    expect(button?.classList.contains("absolute")).toBe(true);
    expect(button?.classList.contains("bg-white")).toBe(true);
    expect(button?.classList.contains("rounded-full")).toBe(true);
  });
});
