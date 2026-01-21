import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@xenova/transformers'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2048mb',
    },
  },
};

export default nextConfig;
