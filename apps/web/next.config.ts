import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@volleyball/types', '@volleyball/utils'],
};

export default nextConfig;
