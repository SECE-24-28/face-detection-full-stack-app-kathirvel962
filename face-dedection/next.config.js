/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images served from any https host (profile pics stored as URLs)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
