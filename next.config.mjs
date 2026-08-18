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
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/jobs',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/jobs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/o/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/api/recruitment/public/jobs',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/api/recruitment/public/jobs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
