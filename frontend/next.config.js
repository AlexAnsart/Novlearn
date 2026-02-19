const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration pour le développement local et la production
  async rewrites() {
    // En développement, proxy vers localhost
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8010/api/:path*",
        },
      ];
    }
    // En production, les rewrites sont gérés par Nginx
    return [];
  },
};

module.exports = withPWA(nextConfig);
