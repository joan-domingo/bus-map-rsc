interface LineStructuredDataProps {
  lineName: string;
  path: string;
}

export function LineStructuredData({
  lineName,
  path,
}: LineStructuredDataProps) {
  const baseUrl = "https://quantriga.com";
  const line = lineName.toUpperCase();
  const url = `${baseUrl}${path}`;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Bus ${line} Moventis en temps real`,
    description: `Consulta la línia ${line} de Moventis en temps real amb mapa de parades i properes arribades.`,
    url,
    inLanguage: ["ca", "es"],
    keywords: `bus ${line}, Moventis ${line}, ${line} temps real, ${line} tiempo real, parades ${line}, horaris ${line}`,
    isPartOf: {
      "@type": "WebSite",
      name: "QuanTriga.com",
      url: baseUrl,
    },
    about: {
      "@type": "BusTrip",
      name: `Moventis línia ${line}`,
      provider: {
        "@type": "Organization",
        name: "Moventis",
      },
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inici",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Línies",
          item: `${baseUrl}/linies`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: line,
          item: url,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires this, content is sanitized
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(webPage).replace(/</g, "\\u003c"),
      }}
    />
  );
}
