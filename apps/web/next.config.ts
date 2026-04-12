import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@volleyball/types', '@volleyball/utils'],
  webpack(config, { dir }) {
    // Force all React imports to the single apps/web copy (React 19).
    // Without this, recharts (hoisted to monorepo root) resolves to the
    // root node_modules/react@18 while Next.js components use react@19,
    // producing a "multiple React instances" crash (React error #31).
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(dir, 'node_modules', 'react'),
      'react-dom': path.resolve(dir, 'node_modules', 'react-dom'),
    };
    return config;
  },
};

export default nextConfig;
