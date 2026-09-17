import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://emojiforge.ai";
  const routes = ["", "/workspace/text-art", "/workspace/kaomoji", "/workspace/mosaic", "/workspace/stickers"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
