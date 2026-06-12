import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { QueryProvider } from "@/components/ui/QueryProvider"
import { AIChatWidget } from "@/components/ai/AIChatWidget"
import { defaultMetadata } from "@/lib/seo"
import "./globals.css"

export const metadata: Metadata = defaultMetadata

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale   = await getLocale()
  const messages = await getMessages()
  const isRtl    = locale === "ar"

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              {children}
              {/* AI Chat Widget — يظهر في كل الصفحات */}
              <AIChatWidget />
              <Toaster
                position={isRtl ? "bottom-left" : "bottom-right"}
                toastOptions={{
                  style: {
                    background:  "var(--bg)",
                    color:       "var(--text)",
                    border:      "1px solid var(--border)",
                    borderRadius:"0.75rem",
                    fontFamily:  "inherit",
                  },
                }}
              />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
