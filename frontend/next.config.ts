import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.lottie": { type: "asset" },
    },
  },
};

export default nextConfig;
