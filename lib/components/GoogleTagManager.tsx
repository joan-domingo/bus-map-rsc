"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export function GoogleTagManager() {
  useEffect(() => {
    const gtagDev = undefined;
    const gtagProd = "G-8F7T65ZT1G";
    const gtagID = /localhost/.test(window.location.hostname)
      ? gtagDev
      : gtagProd;

    if (gtagID) {
      const googleTagManager = document.createElement("script");
      googleTagManager.setAttribute(
        "src",
        `https://www.googletagmanager.com/gtag/js?id=${gtagID}`,
      );
      document.head.appendChild(googleTagManager);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }
      gtag("js", new Date());
      gtag("config", gtagID);
    }
  }, []);

  return null;
}
