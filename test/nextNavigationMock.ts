import { mock } from "bun:test";

/**
 * next/navigation's notFound() and redirect() work by throwing, and Next
 * catches those errors upstream. The doubles keep that contract so tests can
 * assert a page bailed out, and expose where it tried to go.
 */
export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class RedirectError extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.name = "RedirectError";
  }
}

mock.module("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundError();
  },
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
}));
