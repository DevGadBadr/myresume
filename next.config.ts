import type { NextConfig } from 'next';
import path from 'path';
import { APP_BASE_PATH } from './src/lib/config';

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  serverExternalPackages: ['mongoose', 'puppeteer'],
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
