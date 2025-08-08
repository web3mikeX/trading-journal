import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  reactStrictMode: false,
  
  
  // Windows compatibility fixes with complete worker disabling
  webpack: (config: any, { dev, isServer }) => {
    // Fix Windows path issues
    config.resolve.symlinks = false;
    
    // Completely disable caching to avoid worker issues
    config.cache = false;
    
    // Fix path separators for Windows
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    
    // Better Windows compatibility
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    
    // Force single-threaded compilation
    config.parallelism = 1;
    
    // Disable ALL optimization to prevent worker spawning
    config.optimization = {
      minimize: false,
      splitChunks: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      mergeDuplicateChunks: false,
      concatenateModules: false,
      flagIncludedChunks: false,
      providedExports: false,
      usedExports: false,
      sideEffects: false,
    };
    
    // Remove any worker-related plugins
    if (config.plugins) {
      config.plugins = config.plugins.filter((plugin: any) => {
        const pluginName = plugin.constructor.name;
        return !pluginName.includes('Worker') && 
               !pluginName.includes('Thread') &&
               !pluginName.includes('Terser');
      });
    }
    
    return config;
  },
  
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  
  // Force single process mode and disable all caching
  env: {
    NEXT_DISABLE_CACHE: '1',
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
