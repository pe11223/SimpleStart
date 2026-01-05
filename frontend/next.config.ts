import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: {
    position: 'bottom-right',
  },
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT || "8000";
    return [
      {
        source: "/api/py/:path*",
        destination: `http://127.0.0.1:${backendPort}/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;