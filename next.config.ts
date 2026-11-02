import type { NextConfig } from 'next';
const nextConfig: NextConfig = process.env.RUBY_DESKTOP === '1' ? { output: 'export', trailingSlash: true, images: { unoptimized: true }, distDir: '.next-desktop' } : process.env.RUBY_DESKTOP_DEV === '1' ? {distDir:'.next-desktop-dev'} : {};
export default nextConfig;
