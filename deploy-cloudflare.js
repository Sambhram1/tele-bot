#!/usr/bin/env node

/**
 * @fileoverview One-command deployment script for Cloudflare Workers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
    console.log(`\n🔄 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit', cwd: __dirname });
        console.log(`✅ ${description} completed`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        process.exit(1);
    }
}

async function deployBot() {
    console.log('🚀 Starting Cloudflare Workers deployment...\n');
    
    // Check if .env exists
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found!');
        console.log('Please create .env file with your BOT_TOKEN');
        process.exit(1);
    }
    
    // Read bot token
    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/BOT_TOKEN[=:]\s*["']?([^"'\n\r]+)["']?/);
    
    if (!tokenMatch || !tokenMatch[1]) {
        console.error('❌ BOT_TOKEN not found in .env file!');
        process.exit(1);
    }
    
    const botToken = tokenMatch[1];
    console.log('✅ Bot token found');
    
    try {
        // Step 1: Login check
        console.log('\n🔑 Checking Cloudflare authentication...');
        try {
            execSync('npx wrangler whoami', { stdio: 'pipe' });
            console.log('✅ Already logged in to Cloudflare');
        } catch {
            console.log('🔐 Please login to Cloudflare...');
            runCommand('npx wrangler login', 'Cloudflare login');
        }
        
        // Step 2: Set bot token secret
        console.log('\n🔒 Setting bot token secret...');
        console.log('When prompted, paste your bot token and press Enter');
        
        // Create a temporary file with the token
        const tempTokenFile = path.join(__dirname, '.temp_token');
        fs.writeFileSync(tempTokenFile, botToken);
        
        try {
            execSync(`npx wrangler secret put BOT_TOKEN < ${tempTokenFile}`, { stdio: 'inherit' });
            console.log('✅ Bot token secret set successfully');
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempTokenFile)) {
                fs.unlinkSync(tempTokenFile);
            }
        }
        
        // Step 3: Deploy
        runCommand('npx wrangler deploy', 'Deploying to Cloudflare Workers');
        
        // Step 4: Get worker URL
        console.log('\n🔍 Getting worker URL...');
        const result = execSync('npx wrangler whoami', { encoding: 'utf8' });
        
        // Try to extract subdomain or use default
        let workerUrl = 'https://telegram-ai-image-editor.your-subdomain.workers.dev';
        
        console.log('\n🎉 Deployment completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Find your worker URL in the Cloudflare dashboard');
        console.log('2. Setup the webhook with:');
        console.log(`   node scripts/setup-webhook.js [YOUR_WORKER_URL]`);
        console.log('\n🔗 Cloudflare Dashboard: https://dash.cloudflare.com');
        console.log('📱 Test your bot on Telegram after setting up the webhook!');
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure you have a Cloudflare account');
        console.log('2. Check your internet connection');
        console.log('3. Verify your bot token is correct');
        console.log('4. Try running: npm run cf:login');
        process.exit(1);
    }
}

if (require.main === module) {
    deployBot();
}

module.exports = { deployBot };
