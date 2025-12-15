/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export',  // Enable static export for GitHub Pages
    images: {
        unoptimized: true, // Required for static export
    },
    // Force a new build to sync GitHub Actions
    trailingSlash: true,
};

module.exports = nextConfig;
