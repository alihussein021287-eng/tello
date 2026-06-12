import { notFound } from "next/navigation"
import Image from "next/image"
import { Star, Package, Store } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ProductCard } from "@/components/product/ProductCard"
import type { Metadata } from "next"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function getVendorData(vendorId: string) {
  try {
    const [vendorRes, productsRes] = await Promise.all([
      fetch(`${API}/api/vendor/public/${vendorId}`, { next: { revalidate: 300 } }),
      fetch(`${API}/api/products?vendorId=${vendorId}&limit=20`, { next: { revalidate: 60 } }),
    ])
    if (!vendorRes.ok) return null
    const vendor   = await vendorRes.json()
    const products = await productsRes.json()
    return { vendor: vendor.data, products: products.data || [] }
  } catch { return null }
}

export async function generateMetadata({ params }: { params: { vendorId: string } }): Promise<Metadata> {
  const data = await getVendorData(params.vendorId)
  if (!data) return { title: "متجر غير موجود" }
  return {
    title:       `${data.vendor.storeNameAr} | Tello`,
    description: data.vendor.description || `تسوق من ${data.vendor.storeNameAr} على Tello`,
  }
}

export default async function VendorStorePage({ params }: { params: { vendorId: string } }) {
  const data = await getVendorData(params.vendorId)
  if (!data) notFound()
  const { vendor, products } = data

  return (
    <>
      <Header />
      <main>
        {/* Store Header */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Logo */}
            <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
              {vendor.logo
                ? <Image src={vendor.logo} alt={vendor.storeNameAr} width={80} height={80} className="object-cover w-full h-full" />
                : <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-primary-500" />
                  </div>
              }
            </div>

            <div className="text-center sm:text-start">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <h1 className="text-2xl font-bold">{vendor.storeNameAr}</h1>
                {vendor.isVerified && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">✓ موثق</span>
                )}
              </div>
              <p className="text-primary-100 text-sm mb-3">{vendor.storeName}</p>
              {vendor.description && (
                <p className="text-primary-100 text-sm max-w-md leading-relaxed">{vendor.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start text-sm text-primary-100">
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {products.length} منتج
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="font-bold text-lg mb-5">منتجات المتجر</h2>

          {products.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>لا توجد منتجات بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
