const createNextIntlPlugin = require('next-intl/plugin')
const path = require('path')

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include pdfkit font files in the build
  outputFileTracingIncludes: {
    '/api/sanitycheck-pdf': ['./node_modules/pdfkit/js/data/**/*'],
  },
  // Transpile ESM-only PDF renderer for client bundles
  transpilePackages: ['@react-pdf/renderer'],
  reactStrictMode: true,
  trailingSlash: false, // Ensure URLs don't have trailing slashes
  eslint: {
    // Tillåt prod-build utan att eslint är installerat i CI-miljöer
    ignoreDuringBuilds: true,
  },
  // Exclude ESM-only packages from server-side bundling
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unpkg.com',
        pathname: '/leaflet@1.9.4/dist/images/**',
      },
    ],
    // Optimize images för production
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    // Ensure images are served from the correct domain
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // Webpack configuration to handle Node.js environment
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Polyfill for Node.js environment - exclude browser APIs
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
      
      // Define File as undefined in server-side code to prevent "File is not defined" errors
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.DefinePlugin({
          'File': 'undefined',
          'global.File': 'undefined',
          'typeof File': '"undefined"',
        })
      )
      
      // Replace any File references with undefined in server-side code
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^File$/,
          require.resolve('./lib/webpack-file-polyfill.js')
        )
      )
      
      // Handle pdfkit AFM font files
      config.module.rules.push({
        test: /\.afm$/,
        type: 'asset/source',
      })
    }
    return config
  },
  // Ensure correct base URL for image optimization
  ...(process.env.NEXT_PUBLIC_BASE_URL && {
    assetPrefix: undefined, // Let Next.js handle it automatically
  }),
  // Security headers (complementing middleware.ts)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
}

module.exports = withNextIntl(nextConfig)

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "billboardbee",
    project: "javascript-nextjs-19",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
