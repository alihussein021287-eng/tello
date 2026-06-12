import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow:  ["/account/", "/checkout/", "/vendor/dashboard/", "/api/"],
      },
    ],
    sitemap:   "https://fshsmart.com/sitemap.xml",
    host:      "https://fshsmart.com",
  }
}
