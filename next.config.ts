import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/download': ['./ebook.pdf'],
  },
};

export default nextConfig;
