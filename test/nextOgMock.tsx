import { mock } from "bun:test";

/**
 * The real ImageResponse rasterises the page and fetches Twemoji SVGs over the
 * network, so tests capture the element and options instead.
 */
export class FakeImageResponse {
  constructor(
    readonly element: unknown,
    readonly options: unknown,
  ) {}
}

mock.module("next/og", () => ({ ImageResponse: FakeImageResponse }));
