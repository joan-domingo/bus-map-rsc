"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = "G-8F7T65ZT1G";

export function GoogleTagManager() {
  const [shouldLoadGA, setShouldLoadGA] = useState(false);

  useEffect(() => {
    // Check if we're on localhost
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";
    setShouldLoadGA(!isLocalhost);
  }, []);

  if (!shouldLoadGA) {
    return null;
  }

  return (
    <>
      {/* Initialize dataLayer and gtag function - must run before external script */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for GA4 initialization
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      {/* Load Google Analytics script */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
    </>
  );
}
