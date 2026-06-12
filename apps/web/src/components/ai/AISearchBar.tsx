"use client"
import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface AISearchResult {
  id: string
  nameAr: string
  price: number
  image?: string
}

export function AISearchBar() {
  const t = useTranslations("nav")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AISearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ai/search?q=${encodeURIComponent(query)}`
        )
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data.slice(0, 5))
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timerRef.current)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query)}`)
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {loading ? (
            <Loader2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
          ) : (
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder={t("search")}
            className="input ps-10 pe-10 h-10 text-sm"
          />
          {query && (
            <Sparkles className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
          )}
        </div>
      </form>

      {/* AI Results Dropdown */}
      {focused && results.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span className="text-xs text-[var(--text-muted)] font-medium">نتائج ذكية</span>
          </div>
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => router.push(`/products/${product.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-soft)] transition-colors text-start"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-soft)] flex-shrink-0">
                {product.image ? (
                  <Image src={product.image} alt={product.nameAr} width={40} height={40} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[var(--text)]">{product.nameAr}</p>
                <p className="text-xs text-primary-500 font-semibold">{product.price?.toLocaleString()} د.ع</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => router.push(`/products?q=${encodeURIComponent(query)}`)}
            className="w-full px-3 py-2.5 text-sm text-primary-500 hover:bg-[var(--bg-soft)] transition-colors text-center border-t border-[var(--border)]"
          >
            عرض كل النتائج لـ "{query}"
          </button>
        </div>
      )}
    </div>
  )
}
