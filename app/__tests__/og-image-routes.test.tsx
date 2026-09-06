import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { FakeImageResponse } from "../../test/nextOgMock";
import {
  GET as getLineOgImage,
  contentType as lineContentType,
  runtime as lineRuntime,
  size as lineSize,
} from "../og-image/[line]/route";
import {
  GET as getHomeOgImage,
  alt as homeAlt,
  contentType as homeContentType,
  runtime as homeRuntime,
  size as homeSize,
} from "../og-image/route";

function params(line: string) {
  return { params: Promise.resolve({ line }) };
}

function textOf(response: unknown) {
  const { container } = render(
    (response as FakeImageResponse).element as ReactElement,
  );
  return container.textContent ?? "";
}

describe("/og-image", () => {
  it("is declared as an edge PNG card", () => {
    expect(homeRuntime).toBe("edge");
    expect(homeContentType).toBe("image/png");
    expect(homeSize).toEqual({ width: 1200, height: 630 });
    expect(homeAlt).toBe("QuanTriga.com - Moventis temps real");
  });

  it("renders the generic card", async () => {
    const response = await getHomeOgImage();

    expect(response).toBeInstanceOf(FakeImageResponse);
    expect(textOf(response)).toContain("Public Transit Tracker");
  });
});

describe("/og-image/[line]", () => {
  it("is declared as an edge PNG card", () => {
    expect(lineRuntime).toBe("edge");
    expect(lineContentType).toBe("image/png");
    expect(lineSize).toEqual({ width: 1200, height: 630 });
  });

  it("renders the card for a canonical line slug", async () => {
    const response = await getLineOgImage(
      new Request("https://quantriga.com/og-image/n80"),
      params("n80"),
    );

    expect(textOf(response)).toContain("Bus N80 temps real");
  });

  it("404s on an unknown line", async () => {
    const response = await getLineOgImage(
      new Request("https://quantriga.com/og-image/nope"),
      params("nope"),
    );

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(404);
    expect(await (response as Response).text()).toBe("Not found");
  });

  it("404s on an internal numeric id", async () => {
    const response = await getLineOgImage(
      new Request("https://quantriga.com/og-image/14"),
      params("14"),
    );

    expect((response as Response).status).toBe(404);
  });

  it("404s on a non-canonical slug rather than redirecting", async () => {
    const response = await getLineOgImage(
      new Request("https://quantriga.com/og-image/C-30"),
      params("C-30"),
    );

    expect((response as Response).status).toBe(404);
  });

  it("accepts an uppercase spelling of a canonical slug", async () => {
    const response = await getLineOgImage(
      new Request("https://quantriga.com/og-image/N80"),
      params("N80"),
    );

    expect(textOf(response)).toContain("Bus N80 temps real");
  });
});
