/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize webpack cache for production builds
  webpack: (config, { isServer }) => {
    config.cache = {
      type: 'filesystem',
      cacheDirectory: '.next/cache',
      buildDependencies: {
        config: [__filename],
      },
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
    return config
  },
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  // Output optimization
  output: 'standalone',
}

module.exports = nextConfig
