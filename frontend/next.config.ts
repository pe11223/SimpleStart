import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: {
    position: 'bottom-right',
  },
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT || "8001";
    const backendHost = process.env.BACKEND_HOST || "127.0.0.1";
    return [
      {
        source: "/api/py/:path*",
        destination: `http://${backendHost}:${backendPort}/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;