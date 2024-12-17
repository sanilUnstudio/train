import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  api: {
    bodyParser: {
      sizeLimit: "150mb", // Increase limit as needed (e.g., 10mb, 20mb, 50mb)
    },
  },
};

export default nextConfig;
