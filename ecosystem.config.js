module.exports = {
  apps: [{
    name: 'p2p-chat',
    script: 'server.js',
    cwd: './server',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:crusherpg/p2p-secure-chat.git',
      path: '/home/ubuntu/p2p-secure-chat',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};