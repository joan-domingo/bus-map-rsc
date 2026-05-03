import type { MetadataRoute } from "next";
import { getAllLineSlugs } from "../lib/utils/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://quantriga.com";
  const lineUrls = getAllLineSlugs().map((line) => ({
    url: `${baseUrl}/linea/${line}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/linies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...lineUrls,
  ];
}

