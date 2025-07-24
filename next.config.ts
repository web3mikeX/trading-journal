import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  reactStrictMode: false, // Disable strict mode for WSL fix
  
  // Fix for WSL path resolution issues
  webpack: (config: any) => {
    // Resolve symlinks to prevent module resolution issues
    config.resolve.symlinks = false;
    
    // Fix for mixed WSL/Windows paths
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/.git', '**/.next'],
    };
    
    return config;
  },
  
  // Additional experimental flags for stability
  experimental: {
    forceSwcTransforms: true,
  },
  
  // Disable static optimization for pages with hydration issues
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
