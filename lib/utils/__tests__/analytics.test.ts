import { afterEach, describe, expect, it, mock } from "bun:test";
import { trackEvent } from "../analytics";

describe("trackEvent", () => {
  afterEach(() => {
    window.gtag = undefined;
  });

  it("forwards the event name and params to gtag", () => {
    const gtag = mock();
    window.gtag = gtag;

    trackEvent("bus_stop_click", { stop_id: 42 });

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "bus_stop_click",
      { stop_id: 42 },
    ]);
  });

  it("passes undefined params through", () => {
    const gtag = mock();
    window.gtag = gtag;

    trackEvent("location_button_click");

    expect(gtag.mock.calls[0]).toEqual([
      "event",
      "location_button_click",
      undefined,
    ]);
  });

  it("is a no-op when gtag is not loaded", () => {
    window.gtag = undefined;

    expect(() => trackEvent("bus_stop_star", { stop_id: 1 })).not.toThrow();
  });
});
