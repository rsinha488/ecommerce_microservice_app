/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'fakestoreapi.com', 'via.placeholder.com', 'picsum.photos', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    API_AUTH_URL: process.env.API_AUTH_URL || 'http://localhost:4000',
    API_USER_URL: process.env.API_USER_URL || 'http://localhost:3001',
    API_PRODUCT_URL: process.env.API_PRODUCT_URL || 'http://localhost:3002',
    API_INVENTORY_URL: process.env.API_INVENTORY_URL || 'http://localhost:3003',
    API_ORDER_URL: process.env.API_ORDER_URL || 'http://localhost:5003',
  },
}

module.exports = nextConfig

