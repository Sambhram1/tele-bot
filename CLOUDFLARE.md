# 🚀 Cloudflare Workers Deployment Guide

Deploy your Telegram AI Image Editor Bot to Cloudflare Workers for global, serverless hosting.

## 📋 Prerequisites

1. **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Node.js 16+** installed
3. **Telegram Bot Token** from [@BotFather](https://t.me/botfather)

## 🛠️ Quick Setup

### 1. Install Wrangler CLI
```bash
# Install globally
npm install -g wrangler

# Or use the project version
npm install
```

### 2. Login to Cloudflare
```bash
npm run cf:login
# This will open browser for authentication
```

### 3. Configure Bot Token
```bash
npm run cf:secret
# Enter your bot token when prompted
```

### 4. Deploy to Cloudflare Workers
```bash
# Deploy to production
npm run deploy

# Or deploy to staging first
npm run deploy:staging
```

### 5. Setup Webhook
```bash
# After deployment, setup the webhook
npm run cf:webhook https://your-worker.your-subdomain.workers.dev
```

## 📝 Step-by-Step Guide

### Step 1: Prepare Your Project

1. Make sure you have your bot token in `.env`:
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Step 2: Cloudflare Setup

1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Initialize Wrangler (if needed):**
   ```bash
   npx wrangler init
   ```

### Step 3: Configure Secrets

Your bot token needs to be stored securely as a Cloudflare secret:

```bash
# Set the bot token secret
npx wrangler secret put BOT_TOKEN
# Paste your token when prompted
```

### Step 4: Deploy

```bash
# Deploy to production
npm run deploy

# Or test locally first
npm run cf:dev
```

### Step 5: Setup Webhook

After deployment, you'll get a Workers URL like:
`https://telegram-ai-image-editor.your-subdomain.workers.dev`

Setup the Telegram webhook:

```bash
# Automatic setup
node scripts/setup-webhook.js https://telegram-ai-image-editor.your-subdomain.workers.dev

# Manual setup via curl
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://your-worker.your-subdomain.workers.dev"}'
```

## 🔧 Configuration Options

### Environment Variables

Set these via Wrangler secrets:

```bash
# Required
wrangler secret put BOT_TOKEN

# Optional
wrangler secret put NODE_ENV # Set to "production"
```

### Custom Domain (Optional)

1. Add a custom route in `wrangler.toml`:
   ```toml
   [[route]]
   pattern = "bot.yourdomain.com/*"
   zone_name = "yourdomain.com"
   ```

2. Deploy with custom domain:
   ```bash
   npm run deploy:production
   ```

## 📊 Monitoring & Logs

### View Logs
```bash
# Real-time logs
npx wrangler tail

# Logs for specific deployment
npx wrangler tail --env production
```

### Analytics
- Visit [Cloudflare Dashboard](https://dash.cloudflare.com)
- Go to Workers & Pages → Your Worker
- View analytics, logs, and performance metrics

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - run: npm install
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          secrets: |
            BOT_TOKEN
        env:
          BOT_TOKEN: ${{ secrets.BOT_TOKEN }}
```

### Environment Secrets

Add these to your GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `BOT_TOKEN` - Your Telegram bot token

## 🛠️ Available Commands

```bash
# Development
npm run cf:dev          # Run locally with Wrangler dev
npm run cf:login        # Login to Cloudflare
npm run cf:setup        # Complete setup (login + secrets)

# Deployment  
npm run deploy          # Deploy to production
npm run deploy:staging  # Deploy to staging
npm run deploy:production # Deploy to production environment

# Configuration
npm run cf:secret       # Set bot token secret
npm run cf:webhook      # Setup webhook (needs URL argument)
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **"Bot token not configured"**
```bash
# Set the secret properly
npx wrangler secret put BOT_TOKEN
```

#### 2. **"Worker exceeded CPU time"**
- Optimize image processing
- Use external APIs for heavy operations
- Consider Cloudflare Images API

#### 3. **"Webhook setup failed"**
```bash
# Check your worker URL
curl https://your-worker.your-subdomain.workers.dev

# Verify webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

#### 4. **"Module not found"**
- Check `wrangler.toml` has `node_compat = true`
- Ensure dependencies are compatible with Workers

### Debug Mode

Enable debug logging:

```bash
# Local development with debug
npm run cf:dev -- --local --var DEBUG=true
```

### Check Deployment Status

```bash
# List deployments
npx wrangler deployments list

# Get deployment details
npx wrangler deployment tail
```

## 🎯 Production Checklist

- [ ] Bot token set as secret
- [ ] Worker deployed successfully
- [ ] Webhook configured correctly
- [ ] Bot responds to `/start` command
- [ ] Image upload works
- [ ] Error handling tested
- [ ] Monitoring setup
- [ ] Custom domain configured (optional)

## 💰 Cost Considerations

Cloudflare Workers Free Tier:
- ✅ 100,000 requests/day
- ✅ 10ms CPU time per request
- ✅ Global distribution

For higher usage:
- $5/month for 10M requests
- Additional CPU time available

## 🔗 Useful Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare Dashboard](https://dash.cloudflare.com)

---

🎉 **Your bot is now running globally on Cloudflare's edge network!**
