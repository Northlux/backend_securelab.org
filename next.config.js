/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  // Output optimization for Vercel
  output: 'standalone',
  // Allow images from R2 CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.securelab.org',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
}

module.exports = nextConfig
