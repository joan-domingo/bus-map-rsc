import { mock } from "bun:test";

/** next/image needs a real Next runtime, so tests render a plain <img>. */
mock.module("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // biome-ignore lint/performance/noImgElement: replacing next/image with a plain element is the point of the mock
    <img src={src} alt={alt} {...props} />
  ),
}));

/**
 * next/font/google resolves fonts at build time; tests only need the CSS
 * variable and class names the layout spreads onto <body>.
 */
function fakeFont(variable: string) {
  return () => ({
    variable,
    className: `${variable}-class`,
    style: { fontFamily: variable },
  });
}

mock.module("next/font/google", () => ({
  Geist: fakeFont("--font-geist-sans"),
  Geist_Mono: fakeFont("--font-geist-mono"),
}));
