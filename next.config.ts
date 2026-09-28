import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  outputFileTracingIncludes: {
    '/api/download': ['./ebook.pdf', './ebook_en.pdf'],
  },
};

export default nextConfig;
