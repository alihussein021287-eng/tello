"use client"
import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error:  Error & { digest?: string }
  reset:  () => void
}) {
  useEffect(() => {
    // لوغ الخطأ
    console.error("[Global Error]", error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "IBM Plex Sans Arabic, sans-serif", background: "#f7f7f8", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: "420px" }}>

            <div style={{ position: "relative", display: "inline-block", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "7rem", fontWeight: 900, color: "#e5e7eb", lineHeight: 1, userSelect: "none" }}>
                500
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem" }}>
                ⚠️
              </div>
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem", color: "#111318" }}>
              حدث خطأ غير متوقع
            </h1>
            <p style={{ color: "#6b7280", lineHeight: 1.6, marginBottom: "2rem" }}>
              نأسف على هذا الخطأ. فريقنا يعمل على إصلاحه. يمكنك المحاولة مجدداً أو العودة للرئيسية.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  background: "#1B4FD8", color: "#fff",
                  border: "none", borderRadius: "0.75rem",
                  padding: "0.625rem 1.25rem",
                  cursor: "pointer", fontWeight: 600,
                  fontSize: "0.875rem", fontFamily: "inherit",
                }}
              >
                حاول مجدداً
              </button>
              <a
                href="/"
                style={{
                  background: "transparent", color: "#374151",
                  border: "1px solid #e5e7eb", borderRadius: "0.75rem",
                  padding: "0.625rem 1.25rem",
                  cursor: "pointer", fontWeight: 600,
                  fontSize: "0.875rem", textDecoration: "none",
                }}
              >
                الرئيسية
              </a>
            </div>

            {error.digest && (
              <p style={{ marginTop: "1.5rem", fontSize: "0.7rem", color: "#9ca3af", fontFamily: "monospace" }}>
                خطأ: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  )
}
