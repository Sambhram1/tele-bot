/**
 * @fileoverview Main entry point for the Telegram AI Image Editor Bot
 * This file initializes the bot and starts the application
 */

require('dotenv').config();
const { createBot } = require('./bot');
const { startAutoCleanup, debugLog } = require('./utils');
const config = require('./config');

/**
 * Main function to start the bot
 */
async function main() {
    try {
        // Validate environment variables
        const BOT_TOKEN = process.env.BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            console.error('❌ Error: BOT_TOKEN is required in .env file');
            console.log('Please create a .env file with your Telegram bot token:');
            console.log('BOT_TOKEN=your_telegram_bot_token_here');
            console.log('');
            console.log('💡 Run "npm run setup" for guided setup');
            process.exit(1);
        }

        if (BOT_TOKEN === 'your_telegram_bot_token_here') {
            console.error('❌ Error: Please set a real BOT_TOKEN in .env file');
            console.log('💡 Run "npm run setup" for guided setup');
            process.exit(1);
        }

        // Create and configure the bot
        console.log('🤖 Initializing Telegram AI Image Editor Bot...');
        debugLog('Config loaded:', config);
        
        const bot = createBot(BOT_TOKEN);

        // Start auto-cleanup process for temporary files
        if (config.development.debug) {
            startAutoCleanup();
        }

        // Set up graceful shutdown
        process.once('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            bot.stop('SIGINT');
            process.exit(0);
        });

        process.once('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            bot.stop('SIGTERM');
            process.exit(0);
        });

        // Start the bot
        console.log('🚀 Starting bot...');
        await bot.launch();
        
        console.log('✅ Bot is running successfully!');
        console.log('📱 Your bot is ready to receive messages on Telegram');
        console.log('🔗 Bot commands: /start, /edit, /help');
        console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
        console.log('');
        console.log('Press Ctrl+C to stop the bot');

        // Log additional information in debug mode
        if (config.development.debug) {
            console.log('');
            console.log('🐛 Debug mode enabled');
            console.log('🧹 Auto-cleanup interval:', config.development.cleanupInterval / 1000, 'seconds');
            console.log('📁 Temp directory:', config.paths.tempDir);
        }

    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        
        // Provide helpful error messages
        if (error.code === 401) {
            console.log('');
            console.log('🔑 Invalid bot token. Please check your BOT_TOKEN in .env file');
            console.log('Get a valid token from @BotFather on Telegram');
            console.log('💡 Run "npm run setup" for guided setup');
        } else if (error.code === 'ENOTFOUND') {
            console.log('');
            console.log('🌐 Network error. Please check your internet connection');
        } else if (error.code === 'EADDRINUSE') {
            console.log('');
            console.log('🔌 Port already in use. Another instance might be running');
        } else {
            console.log('');
            console.log('💡 Common solutions:');
            console.log('1. Check your BOT_TOKEN in .env file');
            console.log('2. Ensure all dependencies are installed: npm install');
            console.log('3. Check your internet connection');
            console.log('4. Run tests: npm test');
            console.log('5. Run setup: npm run setup');
        }
        
        process.exit(1);
    }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
if (require.main === module) {
    main();
}

module.exports = { main };
