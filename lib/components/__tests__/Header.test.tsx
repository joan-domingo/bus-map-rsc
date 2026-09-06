import { describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getPriorityLineSlugs } from "../../utils/seo";
import { Header } from "../Header";

describe("Header", () => {
  it("shows the generic title when no line is highlighted", () => {
    render(<Header showOnlyStarred={false} onToggleStarred={() => {}} />);

    expect(
      screen.getByRole("heading", {
        name: "QuanTriga.com | Moventis temps real",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mapa interactiu amb parades i horaris actualitzats de Moventis.",
      ),
    ).toBeInTheDocument();
  });

  it("puts the highlighted line, uppercased, in the title and subtitle", () => {
    render(
      <Header
        showOnlyStarred={false}
        onToggleStarred={() => {}}
        highlightedLineName="n80"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "QuanTriga.com | Bus N80 temps real · Moventis",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Properes arribades i parades de la línia N80 al mapa."),
    ).toBeInTheDocument();
  });

  it("links the logo home and lists the first three priority lines", () => {
    render(<Header showOnlyStarred={false} onToggleStarred={() => {}} />);

    const nav = screen.getByRole("navigation", { name: "Línies destacades" });
    const expectedSlugs = getPriorityLineSlugs().slice(0, 3);
    const lineLinks = [...nav.querySelectorAll("a")].slice(0, 3);

    expect(lineLinks.map((link) => link.getAttribute("href"))).toEqual(
      expectedSlugs.map((slug) => `/linea/${slug}`),
    );
    expect(lineLinks.map((link) => link.textContent)).toEqual(
      expectedSlugs.map((slug) => `${slug.toUpperCase()} temps real`),
    );
    expect(
      screen.getByRole("link", { name: "Totes les línies" }),
    ).toHaveAttribute("href", "/linies");
  });

  it("separates the priority links with a middle dot, except the first", () => {
    render(<Header showOnlyStarred={false} onToggleStarred={() => {}} />);

    const nav = screen.getByRole("navigation", { name: "Línies destacades" });
    // Two separators between the three line links, plus one before "Totes"
    expect(nav.textContent?.split(" · ")).toHaveLength(4);
  });

  it("offers an empty star and the 'show only starred' label when unfiltered", async () => {
    const onToggleStarred = mock();
    render(
      <Header showOnlyStarred={false} onToggleStarred={onToggleStarred} />,
    );

    const button = screen.getByRole("button", {
      name: "Mostrar només parades preferides",
    });
    expect(button).toHaveTextContent("☆");
    expect(button).toHaveAttribute("title", "Mostrar només parades preferides");

    await userEvent.click(button);
    expect(onToggleStarred).toHaveBeenCalledTimes(1);
  });

  it("offers a filled star and the 'show all' label when filtered", async () => {
    const onToggleStarred = mock();
    render(<Header showOnlyStarred onToggleStarred={onToggleStarred} />);

    const button = screen.getByRole("button", {
      name: "Mostrar totes les parades",
    });
    expect(button).toHaveTextContent("★");

    await userEvent.click(button);
    expect(onToggleStarred).toHaveBeenCalledTimes(1);
  });

  it("hides the decorative bus icon from assistive tech", () => {
    const { container } = render(
      <Header showOnlyStarred={false} onToggleStarred={() => {}} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "/busIcon.svg");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("aria-hidden");
  });
});
