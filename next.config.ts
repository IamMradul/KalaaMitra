import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for better Vercel compatibility
  output: 'standalone',
  // Ensure proper handling of dynamic imports
  transpilePackages: ['react-i18next', 'i18next'],
};

export default nextConfig;
