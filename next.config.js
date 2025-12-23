/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // output: 'export',  // Disabled to allow API Routes
    // images: {
    //     unoptimized: true,
    // },
    // Force a new build to sync GitHub Actions
    trailingSlash: true,
};

module.exports = nextConfig;
