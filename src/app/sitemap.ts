import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, retailers] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, take: 5000 }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.retailer.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: appUrl, changeFrequency: "daily", priority: 1 },
    { url: `${appUrl}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${appUrl}/compare`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${appUrl}/retailers`, changeFrequency: "weekly", priority: 0.6 },
    ...categories.map((c) => ({
      url: `${appUrl}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...retailers.map((r) => ({
      url: `${appUrl}/retailers/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    ...products.map((p) => ({
      url: `${appUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "hourly" as const,
      priority: 0.9,
    })),
  ];
}
