import type { NextConfig } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// The release version shown in game (game/app-version.ts) comes from package.json.
const version: string = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')).version;
const env = { NEXT_PUBLIC_APP_VERSION: version };
const nextConfig: NextConfig = process.env.RUBY_DESKTOP === '1' ? { env, output: 'export', trailingSlash: true, images: { unoptimized: true }, distDir: '.next-desktop' } : process.env.RUBY_DESKTOP_DEV === '1' ? { env, distDir:'.next-desktop-dev'} : { env };
export default nextConfig;
