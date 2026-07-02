import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.3", "localhost:3000"],
  async rewrites() {
    return [
      {
        source: "/docs",
        destination: "https://avenue.mintlify.app/docs",
      },
      {
        source: "/docs/:match*",
        destination: "https://avenue.mintlify.app/docs/:match*",
      },
    ];
  },
};

export default nextConfig;
