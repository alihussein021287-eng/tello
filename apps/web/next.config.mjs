import createNextIntlPlugin from "next-intl/plugin"
const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts")
const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "storage.fshsmart.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
}
export default withNextIntl(nextConfig)
