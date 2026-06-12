import type { Metadata } from "next"

const SITE_URL  = "https://fshsmart.com"
const SITE_NAME = "Tello | تيلو"
const SITE_DESC = "منصة التسوق الإلكتروني الأولى في العراق — آلاف المنتجات بأفضل الأسعار مع توصيل سريع"

// ── Default metadata ──────────────────────────────────────
export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:  SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords:    ["تسوق العراق", "متجر إلكتروني", "Tello", "تيلو", "تسوق أونلاين"],
  authors:     [{ name: "Tello", url: SITE_URL }],
  creator:     "Tello",
  openGraph: {
    type:        "website",
    locale:      "ar_IQ",
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       SITE_NAME,
    description: SITE_DESC,
    images: [{
      url:    `${SITE_URL}/og-image.jpg`,
      width:  1200,
      height: 630,
      alt:    "Tello — منصة التسوق العراقية",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       SITE_NAME,
    description: SITE_DESC,
    images:      [`${SITE_URL}/og-image.jpg`],
  },
  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon:    "/favicon.svg",
    apple:   "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

// ── Product metadata ──────────────────────────────────────
export function productMetadata(product: any): Metadata {
  const name  = product.nameAr || product.name
  const desc  = product.descriptionAr || product.description
  const image = product.images?.[0]

  return {
    title:       name,
    description: desc?.slice(0, 160),
    openGraph: {
      type:        "article",
      title:       `${name} | Tello`,
      description: desc?.slice(0, 160),
      url:         `${SITE_URL}/products/${product.id}`,
      images:      image ? [{ url: image, width: 800, height: 800, alt: name }] : undefined,
    },
    alternates: {
      canonical: `${SITE_URL}/products/${product.id}`,
    },
  }
}

// ── Category metadata ─────────────────────────────────────
export function categoryMetadata(category: any): Metadata {
  const name = category.nameAr || category.name
  return {
    title:       `${name} — تسوق ${name} بأفضل الأسعار`,
    description: `اكتشف أفضل منتجات ${name} على Tello بأسعار تنافسية وتوصيل سريع في العراق`,
    alternates:  { canonical: `${SITE_URL}/products?category=${category.id}` },
  }
}

// ── JSON-LD Structured Data ───────────────────────────────
export function productJsonLd(product: any) {
  return {
    "@context":   "https://schema.org",
    "@type":      "Product",
    name:          product.nameAr || product.name,
    description:   product.descriptionAr || product.description,
    image:         product.images || [],
    sku:           product.id,
    brand: {
      "@type": "Brand",
      name:    product.vendor?.storeName || "Tello",
    },
    offers: {
      "@type":         "Offer",
      price:           product.price,
      priceCurrency:   "IQD",
      availability:    product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url:             `${SITE_URL}/products/${product.id}`,
      seller: {
        "@type": "Organization",
        name:    "Tello",
      },
    },
    aggregateRating: product.reviews?.length ? {
      "@type":      "AggregateRating",
      ratingValue:  (product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length).toFixed(1),
      reviewCount:  product.reviews.length,
      bestRating:   "5",
      worstRating:  "1",
    } : undefined,
  }
}

export function websiteJsonLd() {
  return {
    "@context":       "https://schema.org",
    "@type":          "WebSite",
    name:             SITE_NAME,
    url:              SITE_URL,
    description:      SITE_DESC,
    inLanguage:       "ar",
    potentialAction: {
      "@type":       "SearchAction",
      target:        `${SITE_URL}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}
