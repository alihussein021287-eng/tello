import { MetadataRoute } from "next"

const BASE = "https://fshsmart.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                   lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/products`,     lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/auth/login`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/auth/register`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/vendor/register`,lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  // Dynamic — Products
  let productPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=500`, {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    productPages = (data.data || []).map((p: any) => ({
      url:             `${BASE}/products/${p.id}`,
      lastModified:    new Date(p.updatedAt || p.createdAt),
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }))
  } catch {}

  // Dynamic — Categories
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
      next: { revalidate: 86400 },
    })
    const data = await res.json()
    categoryPages = (data.data || []).map((c: any) => ({
      url:             `${BASE}/products?category=${c.id}`,
      lastModified:    new Date(),
      changeFrequency: "weekly" as const,
      priority:        0.7,
    }))
  } catch {}

  return [...staticPages, ...productPages, ...categoryPages]
}
