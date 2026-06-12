"use client"
import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="text-xl font-bold mb-2 text-[var(--text)]">حدث خطأ</h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          تعذر تحميل هذه الصفحة. حاول مجدداً أو عد للرئيسية.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-sm">
            حاول مجدداً
          </button>
          <Link href="/" className="btn-ghost border border-[var(--border)] text-sm">
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
