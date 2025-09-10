# Deployment Guide - Telegram AI Image Editor Bot

This guide explains how to deploy the Telegram AI Image Editor Bot to various platforms.

## Prerequisites

- Node.js 16.0.0 or higher
- Telegram Bot Token from [@BotFather](https://t.me/botfather)
- Git (for deployment)

## Local Development

1. **Clone/Download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Setup bot token:**
   ```bash
   npm run setup
   ```
4. **Run tests:**
   ```bash
   npm test
   ```
5. **Start development server:**
   ```bash
   npm run dev
   ```

## Production Deployment

### Option 1: VPS/Dedicated Server

1. **Setup server with Node.js:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

2. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd telegram-ai-image-editor
   npm install --production
   ```

3. **Configure environment:**
   ```bash
   echo "BOT_TOKEN=your_real_token_here" > .env
   echo "NODE_ENV=production" >> .env
   ```

4. **Install PM2 for process management:**
   ```bash
   npm install -g pm2
   ```

5. **Start with PM2:**
   ```bash
   pm2 start index.js --name "telegram-image-bot"
   pm2 startup
   pm2 save
   ```

### Option 2: Heroku

1. **Create Heroku app:**
   ```bash
   heroku create your-bot-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set BOT_TOKEN=your_token_here
   heroku config:set NODE_ENV=production
   ```

3. **Create Procfile:**
   ```
   web: node index.js
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy bot"
   git push heroku main
   ```

### Option 3: Railway

1. **Connect your GitHub repo to Railway**
2. **Set environment variables in Railway dashboard:**
   - `BOT_TOKEN`: your_token_here
   - `NODE_ENV`: production

3. **Railway will auto-deploy on push**

### Option 4: DigitalOcean App Platform

1. **Create new app from GitHub repo**
2. **Configure build and run commands:**
   - Build: `npm install`
   - Run: `npm start`
3. **Set environment variables:**
   - `BOT_TOKEN`: your_token_here
   - `NODE_ENV`: production

### Option 5: AWS EC2

1. **Launch EC2 instance (Ubuntu 20.04 LTS)**
2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd telegram-ai-image-editor
   npm install --production
   ```

4. **Configure environment and start with PM2**

### Option 6: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm install --production
   
   COPY . .
   
   RUN mkdir -p temp
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t telegram-image-bot .
   docker run -d -e BOT_TOKEN=your_token_here telegram-image-bot
   ```

## Environment Variables

### Required
- `BOT_TOKEN`: Your Telegram bot token

### Optional
- `NODE_ENV`: Set to 'production' for production deployment
- `PORT`: Port for webhook (default: 3000)

## Security Considerations

1. **Never commit .env file to version control**
2. **Use HTTPS for webhooks in production**
3. **Regularly rotate bot token if compromised**
4. **Limit server access with firewall rules**
5. **Use process managers (PM2) for auto-restart**
6. **Monitor logs for suspicious activity**

## Performance Optimization

1. **Enable Node.js clustering:**
   ```javascript
   // Add to index.js for multi-core support
   const cluster = require('cluster');
   const numCPUs = require('os').cpus().length;
   
   if (cluster.isMaster) {
       for (let i = 0; i < numCPUs; i++) {
           cluster.fork();
       }
   } else {
       // Your bot code here
   }
   ```

2. **Use webhook instead of polling for high traffic:**
   ```javascript
   // In bot.js, add webhook support
   if (process.env.NODE_ENV === 'production') {
       bot.launch({
           webhook: {
               domain: process.env.WEBHOOK_DOMAIN,
               port: process.env.PORT || 3000
           }
       });
   } else {
       bot.launch();
   }
   ```

3. **Implement rate limiting**
4. **Use Redis for session storage in multi-instance setup**
5. **Optimize image processing with worker threads**

## Monitoring and Logging

1. **Setup application monitoring:**
   - PM2 monitoring
   - New Relic
   - DataDog

2. **Log aggregation:**
   - Winston logger
   - ELK Stack
   - Splunk

3. **Health checks:**
   ```javascript
   // Add health check endpoint
   app.get('/health', (req, res) => {
       res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
   });
   ```

## Backup and Recovery

1. **Regular code backups via Git**
2. **Database backups (if using persistent storage)**
3. **Configuration backups**
4. **Disaster recovery plan**

## Scaling

### Horizontal Scaling
- Load balancers
- Multiple bot instances
- Shared session storage (Redis)

### Vertical Scaling
- Increase server resources
- Optimize image processing
- Use worker threads

## Troubleshooting

### Common Issues

1. **Bot not responding:**
   - Check bot token
   - Verify internet connection
   - Check server logs

2. **Image processing fails:**
   - Verify Sharp installation
   - Check file permissions
   - Monitor memory usage

3. **High memory usage:**
   - Implement proper cleanup
   - Use streaming for large files
   - Add memory limits

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## Support

For deployment issues:
1. Check server logs
2. Verify all dependencies are installed
3. Test locally first
4. Check network connectivity
5. Monitor resource usage

Remember to test thoroughly in a staging environment before deploying to production!
