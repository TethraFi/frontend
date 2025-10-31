/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/gmx/:network/:path*',
        destination: 'https://:network-api.gmxinfra.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig;