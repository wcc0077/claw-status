module.exports = {
  apps: [
    {
      name: 'openclaw-dashboard',
      script: './dist-server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        DASHBOARD_PORT: 3000,
        OPENCLAW_GATEWAY_URL: 'ws://127.0.0.1:18789',
      },
    },
  ],
};
