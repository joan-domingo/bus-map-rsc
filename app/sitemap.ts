import type { MetadataRoute } from "next";
import { buildLinePagePath, getAllLineSlugs } from "../lib/utils/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://quantriga.com";
  const lineUrls = getAllLineSlugs().map((line) => ({
    url: `${baseUrl}${buildLinePagePath(line)}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/linies`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...lineUrls,
  ];
}
