/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["xlsx"],
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/categories/:slug",
        destination: "/catalog?category=:slug",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
