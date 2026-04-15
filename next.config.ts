import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a minimal standalone server bundle for the Docker image
  output: "standalone",

  async rewrites() {
    // Proxy /api/* calls to the job-ops backend during development
    const jobOpsUrl = process.env.JOB_OPS_URL || "http://localhost:3005";
    return [
      {
        source: "/api/:path*",
        destination: `${jobOpsUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
