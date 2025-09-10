#!/usr/bin/env node

/**
 * @fileoverview Setup script for the Telegram AI Image Editor Bot
 * This script helps users set up the bot quickly
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function setup() {
    console.log('🤖 Telegram AI Image Editor Bot Setup\n');
    
    try {
        // Check if .env already exists
        const envPath = path.join(__dirname, '.env');
        let botToken = '';
        
        if (await fs.pathExists(envPath)) {
            console.log('📄 Found existing .env file');
            const envContent = await fs.readFile(envPath, 'utf8');
            const tokenMatch = envContent.match(/BOT_TOKEN=(.+)/);
            
            if (tokenMatch && tokenMatch[1] !== 'your_telegram_bot_token_here') {
                console.log('✅ Bot token already configured');
                botToken = tokenMatch[1];
            }
        }
        
        if (!botToken || botToken === 'your_telegram_bot_token_here') {
            console.log('🔑 Bot token setup required\n');
            console.log('To get a bot token:');
            console.log('1. Message @BotFather on Telegram');
            console.log('2. Send /newbot command');
            console.log('3. Follow the instructions');
            console.log('4. Copy the token provided\n');
            
            botToken = await question('Enter your bot token: ');
            
            if (!botToken || botToken.trim().length === 0) {
                console.log('❌ Invalid token provided');
                process.exit(1);
            }
            
            // Write .env file
            const envContent = `BOT_TOKEN=${botToken.trim()}\nNODE_ENV=development`;
            await fs.writeFile(envPath, envContent);
            console.log('✅ Bot token saved to .env file');
        }
        
        // Create temp directory
        const tempDir = path.join(__dirname, 'temp');
        await fs.ensureDir(tempDir);
        console.log('📁 Created temp directory');
        
        // Test bot token
        console.log('\n🧪 Testing bot token...');
        
        const { Telegraf } = require('telegraf');
        const bot = new Telegraf(botToken.trim());
        
        try {
            const botInfo = await bot.telegram.getMe();
            console.log(`✅ Bot token is valid! Bot name: @${botInfo.username}`);
        } catch (error) {
            console.log('❌ Invalid bot token or network error');
            console.log('Please check your token and try again');
            process.exit(1);
        }
        
        console.log('\n🎉 Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm start');
        console.log('2. Message your bot on Telegram');
        console.log('3. Send /start to begin\n');
        
        const startNow = await question('Start the bot now? (y/n): ');
        
        if (startNow.toLowerCase() === 'y' || startNow.toLowerCase() === 'yes') {
            console.log('\n🚀 Starting bot...\n');
            require('./index.js');
        } else {
            console.log('\nRun "npm start" when ready to start the bot');
            process.exit(0);
        }
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    setup().finally(() => {
        rl.close();
    });
}

module.exports = { setup };
