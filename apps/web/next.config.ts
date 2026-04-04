import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@volleyball/types', '@volleyball/utils'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
