import type { NextConfig } from 'next';
import path from 'path';
import { APP_BASE_PATH } from './src/lib/config';

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  async redirects() {
    return [
      {
        source: '/',
        destination: APP_BASE_PATH,
        permanent: false,
        basePath: false,
      },
      {
        source: '/login',
        destination: `${APP_BASE_PATH}/login`,
        permanent: false,
        basePath: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['mongoose', 'puppeteer'],
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
