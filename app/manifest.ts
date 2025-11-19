import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuanTriga.com - Temps Real Autobusos",
    short_name: "QuanTriga",
    description:
      "Consulta en temps real l'arribada dels propers busos a Cerdanyola del Vallès, Barcelona, Sabadell, Terrassa, Sant Cugat i altres municipis del Vallès.",
    start_url: "/",
    display: "standalone",
    background_color: "#088b9f",
    theme_color: "#088b9f",
    icons: [
      {
        src: "/busIcon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["transport", "travel"],
    lang: "ca",
    dir: "ltr",
    orientation: "any",
  };
}

