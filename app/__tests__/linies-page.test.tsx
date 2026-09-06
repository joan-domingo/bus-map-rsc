import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { getAllSeoLineEntries } from "../../lib/utils/seo";
import LinesIndexPage, { metadata } from "../linies/page";

describe("/linies metadata", () => {
  it("targets the real-time lines query and self-canonicalises", () => {
    expect(metadata.title).toBe("Totes les línies Moventis en temps real");
    expect(metadata.description).toContain("tiempo real");
    expect(metadata.alternates?.canonical).toBe("/linies");
  });
});

describe("LinesIndexPage", () => {
  it("titles the page and links back to the map", () => {
    render(<LinesIndexPage />);

    expect(
      screen.getByRole("heading", {
        name: "Línies Moventis en temps real",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tornar al mapa general" }),
    ).toHaveAttribute("href", "/");
  });

  it("lists every SEO line entry, linked to its own page", () => {
    render(<LinesIndexPage />);

    const lines = getAllSeoLineEntries();
    const items = screen.getAllByRole("listitem");

    expect(items).toHaveLength(lines.length);
    expect(
      items.map((item) => item.querySelector("a")?.getAttribute("href")),
    ).toEqual(lines.map((line) => `/linea/${line.slug}`));
    expect(items.map((item) => item.textContent)).toEqual(
      lines.map((line) => line.name),
    );
  });
});
