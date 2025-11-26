/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep existing API routes working
  async rewrites() {
    return [];
  },
}

module.exports = nextConfig

