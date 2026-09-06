import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

/**
 * testing-library.ts registers the jest-dom matchers on bun:test's expect at
 * runtime; this teaches TypeScript about them.
 */
declare module "bun:test" {
  interface Matchers<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}
