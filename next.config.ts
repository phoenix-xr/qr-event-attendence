import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '10.213.191.135',
    'localhost:3000',
    '127.0.0.1:3000',
    '*.loca.lt',
    '*.trycloudflare.com',
  ],
};

export default nextConfig;
