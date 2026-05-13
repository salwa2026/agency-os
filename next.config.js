/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bullmq', '@prisma/client'],
  },
}

module.exports = nextConfig