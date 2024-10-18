/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/product-owner",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
