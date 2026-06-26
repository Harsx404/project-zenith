import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "worker_threads": false,
        "module": false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:module': false,
        'node:worker_threads': false,
      };
    }
    return config;
  },
};

export default nextConfig;
