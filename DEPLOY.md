# 🚀 One-Command Cloudflare Deployment

Deploy your Telegram bot to Cloudflare Workers in just one command!

## Quick Start

### Prerequisites
- ✅ Cloudflare account (free)
- ✅ Bot token in `.env` file
- ✅ Node.js installed

### Deploy Now!

```bash
# One command deployment
npm run deploy:cloudflare
```

This will:
1. ✅ Check if you're logged into Cloudflare (login if needed)
2. ✅ Set your bot token as a secure secret  
3. ✅ Deploy your bot to Cloudflare Workers
4. ✅ Provide next steps for webhook setup

### After Deployment

1. **Get your Worker URL** from the Cloudflare dashboard
2. **Setup webhook:**
   ```bash
   node scripts/setup-webhook.js https://your-worker.your-subdomain.workers.dev
   ```
3. **Test your bot** on Telegram!

## Manual Steps (if needed)

### 1. Login to Cloudflare
```bash
npm run cf:login
```

### 2. Set Bot Token Secret
```bash
npm run cf:secret
# Paste your bot token when prompted
```

### 3. Deploy
```bash
npm run deploy
```

### 4. Setup Webhook
```bash
npm run cf:webhook https://your-worker-url.workers.dev
```

## Alternative Commands

```bash
# Development mode (local testing)
npm run cf:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production  
npm run deploy:production
```

## 🔍 Find Your Worker URL

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Click your worker name
4. Copy the URL (looks like: `https://telegram-ai-image-editor.your-subdomain.workers.dev`)

## ✅ Verify Deployment

Test your worker:
```bash
curl https://your-worker.your-subdomain.workers.dev
```

Should return: "Telegram AI Image Editor Bot is running on Cloudflare Workers!"

## 🛠️ Troubleshooting

### Common Issues

**"Not logged in"**
```bash
npm run cf:login
```

**"Bot token not configured"**  
```bash
npm run cf:secret
```

**"Worker not found"**
- Check the URL in Cloudflare dashboard
- Ensure deployment was successful

### Get Help

1. Check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
2. View deployment logs: `npx wrangler tail`
3. Check webhook status: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`

---

🎉 **Your bot is now running globally on Cloudflare's edge network!**

**Free tier includes:**
- ✅ 100,000 requests/day
- ✅ Global distribution  
- ✅ Automatic scaling
- ✅ 99.9% uptime
