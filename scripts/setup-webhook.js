/**
 * @fileoverview Script to setup Telegram webhook for Cloudflare Workers deployment
 */

require('dotenv').config();
const axios = require('axios');

async function setupWebhook() {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const WORKER_URL = process.argv[2]; // Get URL from command line argument
    
    if (!BOT_TOKEN) {
        console.error('❌ BOT_TOKEN not found in .env file');
        process.exit(1);
    }
    
    if (!WORKER_URL) {
        console.error('❌ Worker URL required as argument');
        console.log('Usage: node scripts/setup-webhook.js https://your-worker.your-subdomain.workers.dev');
        process.exit(1);
    }
    
    try {
        console.log('🔗 Setting up webhook...');
        console.log('Worker URL:', WORKER_URL);
        
        // Set webhook
        const webhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
        const response = await axios.post(webhookUrl, {
            url: WORKER_URL,
            drop_pending_updates: true
        });
        
        if (response.data.ok) {
            console.log('✅ Webhook setup successful!');
            console.log('🤖 Your bot is now running on Cloudflare Workers');
            console.log('📱 Test it by messaging your bot on Telegram');
        } else {
            console.error('❌ Webhook setup failed:', response.data.description);
        }
        
        // Get webhook info
        const infoResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        if (infoResponse.data.ok) {
            console.log('\n📊 Webhook Info:');
            console.log('URL:', infoResponse.data.result.url);
            console.log('Pending updates:', infoResponse.data.result.pending_update_count);
            if (infoResponse.data.result.last_error_message) {
                console.log('Last error:', infoResponse.data.result.last_error_message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error setting up webhook:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    setupWebhook();
}

module.exports = { setupWebhook };
