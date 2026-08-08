module.exports = {
  apps: [
    {
      name: 'resume-3007',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PUPPETEER_CACHE_DIR: `${process.env.HOME || '/root'}/.cache/puppeteer`,
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
