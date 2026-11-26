import type { NextConfig } from 'next';

const config: NextConfig = {
  images: { unoptimized: true }, // photos are already sized WebP files in /public
  poweredByHeader: false,
};

export default config;
