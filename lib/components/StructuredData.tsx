export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QuanTriga.com",
    description:
      "Consulta en temps real l'arribada dels propers busos a Cerdanyola del Vallès, Barcelona, Sabadell, Terrassa, Sant Cugat, Badalona, Barberà del Vallès, Castellbisbal i altres municipis del Vallès i àrea metropolitana de Barcelona. Informació actualitzada de Moventis amb mapa interactiu de parades.",
    url: "https://quantriga.com",
    applicationCategory: "TransportationApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    author: {
      "@type": "Person",
      name: "Joan Domingo",
    },
    provider: {
      "@type": "Organization",
      name: "QuanTriga.com",
    },
    featureList: [
      "Temps real d'arribada de busos",
      "Mapa interactiu de parades",
      "Informació de Moventis",
      "Consulta per ubicació",
    ],
    keywords:
      "bus, autobús, temps real, mapa busos, parada bus, Moventis, Cerdanyola del Vallès, Barcelona, Sabadell, Terrassa, Sant Cugat, Badalona, Barberà del Vallès, Castellbisbal, Vallès Occidental, Vallès Oriental, àrea metropolitana Barcelona",
    inLanguage: ["ca", "es"],
    audience: {
      "@type": "Audience",
      audienceType: "Usuaris de transport públic",
    },
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires this, content is sanitized with replace
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
