/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  async redirects() {
    return [
      { source: '/programs', destination: '/learning', permanent: true },
      { source: '/training', destination: '/learning', permanent: false },
    ]
  },
}

export default nextConfig
