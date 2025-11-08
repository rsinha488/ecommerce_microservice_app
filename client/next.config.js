/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
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

