import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { QueryProvider } from "@/components/ui/QueryProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "Tello Admin", template: "%s | Tello Admin" },
  description: "لوحة تحكم Tello",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light">
          <QueryProvider>
            {children}
            <Toaster
              position="bottom-left"
              toastOptions={{
                style: {
                  background: "var(--bg-card)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  fontFamily: "inherit",
                  fontSize: "14px",
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
