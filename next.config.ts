import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'obsidian.md',
      },
      {
        protocol: 'https',
        hostname: 'www.cursor.com',
      },
    ],
  },
};

export default nextConfig;
