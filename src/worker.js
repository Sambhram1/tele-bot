/**
 * @fileoverview Cloudflare Workers entry point for Telegram AI Image Editor Bot
 * This file adapts the bot for Cloudflare Workers environment
 */

import { Telegraf } from 'telegraf';

// Simple image processing utilities for Workers environment
// Note: Sharp doesn't work in Workers, so we'll use basic Canvas API or external services
class WorkerImageUtils {
    static async convertToGrayscale(imageBuffer) {
        // For Cloudflare Workers, we'll use the browser Canvas API
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        
        // Create ImageData from buffer and convert to grayscale
        // This is a simplified version - you might want to use external APIs
        return imageBuffer; // Placeholder
    }
    
    static async resizeImage(imageBuffer, width, height) {
        // Use Canvas API for basic resizing
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Basic resize implementation
        return imageBuffer; // Placeholder
    }
    
    static async addTextOverlay(imageBuffer, text, options = {}) {
        // Use Canvas API for text overlay
        const canvas = new OffscreenCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        
        // Add text overlay implementation
        return imageBuffer; // Placeholder
    }
}

// Bot configuration for Workers
function createWorkerBot(token) {
    const bot = new Telegraf(token);
    
    // Store user sessions in memory (for simple use cases)
    // For production, consider using Cloudflare KV or Durable Objects
    const userSessions = new Map();
    
    function getUserSession(userId) {
        if (!userSessions.has(userId)) {
            userSessions.set(userId, {
                currentImage: null,
                awaitingText: false,
                awaitingDimensions: false,
                awaitingRotation: false
            });
        }
        return userSessions.get(userId);
    }
    
    // Download file from Telegram
    async function downloadFile(ctx, fileId) {
        const fileInfo = await ctx.telegram.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
        
        const response = await fetch(fileUrl);
        return await response.arrayBuffer();
    }
    
    // Start command
    bot.start(async (ctx) => {
        const welcomeMessage = `
🤖 **Welcome to AI Image Editor Bot!** (Cloudflare Workers Edition)

I can help you edit images with basic editing features optimized for the cloud.

**Available Features:**
⚫ Grayscale Conversion
📏 Image Resizing  
📝 Text Overlays
🔄 Basic Rotation

**How to use:**
1. Send /edit command
2. Upload an image (JPG, PNG)
3. Choose your editing option
4. Get your edited image!

**Commands:**
/start - Show this welcome message
/edit - Start image editing
/help - Get help information

Ready to edit some images? Send /edit to begin! 🎨
        `;
        
        await ctx.replyWithMarkdown(welcomeMessage);
    });
    
    // Edit command
    bot.command('edit', async (ctx) => {
        const session = getUserSession(ctx.from.id);
        session.currentImage = null;
        
        await ctx.reply(
            '📤 Please send me an image to edit!\n\n' +
            'Supported formats: JPG, PNG\n' +
            'Maximum file size: 10MB (Workers limit)'
        );
    });
    
    // Help command
    bot.help(async (ctx) => {
        const helpMessage = `
🆘 **Help - AI Image Editor Bot** (Workers Edition)

**Available Editing Options:**

⚫ **Grayscale** - Convert colored images to black & white
📏 **Resize** - Change image dimensions
📝 **Add Text** - Overlay custom text on images
🔄 **Rotate** - Basic rotation (90° increments)

**Note:** This is the Cloudflare Workers version with optimized features for cloud deployment.

**Commands:**
/start - Welcome message  
/edit - Start editing
/help - This help message
        `;
        
        await ctx.replyWithMarkdown(helpMessage);
    });
    
    // Handle image uploads
    bot.on('photo', async (ctx) => {
        try {
            const session = getUserSession(ctx.from.id);
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            
            await ctx.reply('⏳ Processing your image...');
            
            const imageBuffer = await downloadFile(ctx, photo.file_id);
            session.currentImage = imageBuffer;
            
            // Create inline keyboard
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '⚫ Grayscale', callback_data: 'edit_grayscale' },
                        { text: '📏 Resize', callback_data: 'edit_resize' }
                    ],
                    [
                        { text: '📝 Add Text', callback_data: 'edit_add_text' },
                        { text: '🔄 Rotate 90°', callback_data: 'edit_rotate' }
                    ],
                    [
                        { text: '🆕 New Image', callback_data: 'edit_new' },
                        { text: '❌ Cancel', callback_data: 'edit_cancel' }
                    ]
                ]
            };
            
            await ctx.reply('✅ Image ready for editing! Choose an option:', {
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Error processing image:', error);
            await ctx.reply('❌ Error processing your image. Please try again.');
        }
    });
    
    // Handle callback queries
    bot.action('edit_grayscale', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.editMessageText('⏳ Converting to grayscale...');
        
        try {
            const session = getUserSession(ctx.from.id);
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first.');
            }
            
            // Process image (placeholder - implement actual conversion)
            const processedImage = await WorkerImageUtils.convertToGrayscale(session.currentImage);
            
            // For now, we'll just confirm the operation
            await ctx.reply('✅ Image converted to grayscale! (Feature coming soon in Workers)');
            
        } catch (error) {
            console.error('Error converting to grayscale:', error);
            await ctx.reply('❌ Error converting image. Please try again.');
        }
    });
    
    bot.action('edit_resize', async (ctx) => {
        await ctx.answerCbQuery();
        const session = getUserSession(ctx.from.id);
        session.awaitingDimensions = true;
        
        await ctx.editMessageText(
            '📏 **Resize Image**\n\n' +
            'Please enter the new dimensions:\n' +
            'Format: `800x600` or `1920x1080`\n\n' +
            'Common sizes:\n' +
            '• HD: 1280x720\n' +
            '• Full HD: 1920x1080\n' +
            '• Square: 800x800',
            { parse_mode: 'Markdown' }
        );
    });
    
    bot.action('edit_add_text', async (ctx) => {
        await ctx.answerCbQuery();
        const session = getUserSession(ctx.from.id);
        session.awaitingText = true;
        
        await ctx.editMessageText(
            '📝 **Add Text Overlay**\n\n' +
            'Please enter the text you want to add:\n\n' +
            '• Text will be centered on the image\n' +
            '• Keep it short for best results\n\n' +
            'Type your text now:'
        );
    });
    
    bot.action('edit_rotate', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.editMessageText('🔄 Rotating image 90° clockwise...');
        
        // Implement rotation logic
        await ctx.reply('✅ Image rotated 90°! (Feature coming soon in Workers)');
    });
    
    bot.action('edit_new', async (ctx) => {
        await ctx.answerCbQuery();
        const session = getUserSession(ctx.from.id);
        session.currentImage = null;
        await ctx.editMessageText('📤 Please send me a new image to edit!');
    });
    
    bot.action('edit_cancel', async (ctx) => {
        await ctx.answerCbQuery();
        const session = getUserSession(ctx.from.id);
        session.currentImage = null;
        await ctx.editMessageText('❌ Editing cancelled. Send /edit to start again.');
    });
    
    // Handle text input
    bot.on('text', async (ctx) => {
        const session = getUserSession(ctx.from.id);
        
        if (session.awaitingText) {
            const text = ctx.message.text;
            session.awaitingText = false;
            
            await ctx.reply(`⏳ Adding text "${text}" to your image...`);
            
            // Implement text overlay
            await ctx.reply(`✅ Text "${text}" added! (Feature coming soon in Workers)`);
            
        } else if (session.awaitingDimensions) {
            const input = ctx.message.text.trim();
            const dimensions = input.split(/[x×,\s]+/).map(d => parseInt(d.trim()));
            
            if (dimensions.length !== 2 || dimensions.some(d => isNaN(d) || d <= 0)) {
                return ctx.reply('❌ Invalid format. Please enter dimensions like: 800x600');
            }
            
            const [width, height] = dimensions;
            session.awaitingDimensions = false;
            
            await ctx.reply(`⏳ Resizing image to ${width}×${height}...`);
            
            // Implement resize logic
            await ctx.reply(`✅ Image resized to ${width}×${height}! (Feature coming soon in Workers)`);
            
        } else {
            await ctx.reply('🤔 Send /edit to start editing an image, or /help for assistance.');
        }
    });
    
    // Error handling
    bot.catch((err, ctx) => {
        console.error('Bot error:', err);
        ctx.reply('❌ An unexpected error occurred. Please try again later.');
    });
    
    return bot;
}

// Cloudflare Workers fetch handler
export default {
    async fetch(request, env, ctx) {
        const BOT_TOKEN = env.BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return new Response('Bot token not configured', { status: 500 });
        }
        
        const bot = createWorkerBot(BOT_TOKEN);
        
        // Handle webhook
        if (request.method === 'POST') {
            try {
                const update = await request.json();
                await bot.handleUpdate(update);
                return new Response('OK');
            } catch (error) {
                console.error('Error handling update:', error);
                return new Response('Error', { status: 500 });
            }
        }
        
        // Handle GET requests (for health checks)
        if (request.method === 'GET') {
            return new Response('Telegram AI Image Editor Bot is running on Cloudflare Workers!', {
                headers: { 'Content-Type': 'text/plain' }
            });
        }
        
        return new Response('Method not allowed', { status: 405 });
    }
};
