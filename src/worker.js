/**
 * @fileoverview Cloudflare Workers entry point for Telegram AI Image Editor Bot
 * This file uses native fetch API instead of Telegraf for Workers compatibility
 */

// Simple Telegram Bot API wrapper for Workers
class TelegramBot {
    constructor(token) {
        this.token = token;
        this.apiUrl = `https://api.telegram.org/bot${token}`;
    }

    async sendMessage(chatId, text, options = {}) {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: options.parse_mode || 'Markdown',
            ...options
        };

        const response = await fetch(`${this.apiUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return await response.json();
    }

    async sendPhoto(chatId, photoBuffer, options = {}) {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', new Blob([photoBuffer]), 'image.jpg');
        
        if (options.caption) {
            formData.append('caption', options.caption);
        }
        if (options.reply_markup) {
            formData.append('reply_markup', JSON.stringify(options.reply_markup));
        }

        const response = await fetch(`${this.apiUrl}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    async editMessageText(chatId, messageId, text, options = {}) {
        const payload = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: options.parse_mode || 'Markdown',
            ...options
        };

        const response = await fetch(`${this.apiUrl}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return await response.json();
    }

    async answerCallbackQuery(callbackQueryId, options = {}) {
        const payload = {
            callback_query_id: callbackQueryId,
            ...options
        };

        const response = await fetch(`${this.apiUrl}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return await response.json();
    }

    async getFile(fileId) {
        const response = await fetch(`${this.apiUrl}/getFile?file_id=${fileId}`);
        return await response.json();
    }
}

// Simple image processing utilities for Workers environment
class WorkerImageUtils {
    static async downloadImage(bot, fileId) {
        const fileInfo = await bot.getFile(fileId);
        if (!fileInfo.ok) {
            throw new Error('Failed to get file info');
        }

        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.result.file_path}`;
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            throw new Error('Failed to download image');
        }

        return await response.arrayBuffer();
    }

    static async processImage(imageBuffer, operation, options = {}) {
        // For now, return the original image
        // In a real implementation, you could:
        // 1. Use Canvas API for basic operations
        // 2. Call external image processing APIs
        // 3. Use Cloudflare Image Resizing service
        
        console.log(`Processing image with operation: ${operation}`);
        return imageBuffer;
    }
}

// Bot logic
class WorkerBot {
    constructor(token) {
        this.bot = new TelegramBot(token);
        this.userSessions = new Map();
    }

    getUserSession(userId) {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, {
                currentImage: null,
                awaitingText: false,
                awaitingDimensions: false,
                awaitingRotation: false
            });
        }
        return this.userSessions.get(userId);
    }

    createEditingKeyboard() {
        return {
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
    }

    async handleStart(chatId) {
        const welcomeMessage = `
🤖 **Welcome to AI Image Editor Bot!** 

I can help you edit images with cloud-optimized editing features.

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
        
        return await this.bot.sendMessage(chatId, welcomeMessage);
    }

    async handleEdit(chatId) {
        const session = this.getUserSession(chatId);
        session.currentImage = null;
        
        return await this.bot.sendMessage(chatId,
            '📤 Please send me an image to edit!\n\n' +
            'Supported formats: JPG, PNG\n' +
            'Maximum file size: 10MB'
        );
    }

    async handleHelp(chatId) {
        const helpMessage = `
🆘 **Help - AI Image Editor Bot**

**Available Editing Options:**

⚫ **Grayscale** - Convert colored images to black & white
📏 **Resize** - Change image dimensions
📝 **Add Text** - Overlay custom text on images
🔄 **Rotate** - Basic rotation (90° increments)

**Note:** This is the Cloudflare Workers version optimized for global deployment.

**Commands:**
/start - Welcome message  
/edit - Start editing
/help - This help message

**Powered by Cloudflare Workers** 🌍
        `;
        
        return await this.bot.sendMessage(chatId, helpMessage);
    }

    async handlePhoto(update) {
        const chatId = update.message.chat.id;
        const session = this.getUserSession(chatId);
        
        try {
            const photo = update.message.photo[update.message.photo.length - 1];
            
            await this.bot.sendMessage(chatId, '⏳ Processing your image...');
            
            const imageBuffer = await WorkerImageUtils.downloadImage(this.bot, photo.file_id);
            session.currentImage = imageBuffer;
            
            return await this.bot.sendMessage(chatId, 
                '✅ Image ready for editing! Choose an option:', 
                { reply_markup: this.createEditingKeyboard() }
            );
            
        } catch (error) {
            console.error('Error processing image:', error);
            return await this.bot.sendMessage(chatId, '❌ Error processing your image. Please try again.');
        }
    }

    async handleCallbackQuery(update) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const data = callbackQuery.data;
        const session = this.getUserSession(chatId);

        await this.bot.answerCallbackQuery(callbackQuery.id);

        switch (data) {
            case 'edit_grayscale':
                await this.bot.editMessageText(chatId, messageId, '⏳ Converting to grayscale...');
                
                if (!session.currentImage) {
                    return await this.bot.sendMessage(chatId, '❌ No image found. Please send an image first.');
                }
                
                // Process image (placeholder)
                await this.bot.sendMessage(chatId, '✅ Image converted to grayscale! (Processing simulated)');
                break;

            case 'edit_resize':
                session.awaitingDimensions = true;
                await this.bot.editMessageText(chatId, messageId,
                    '📏 **Resize Image**\n\n' +
                    'Please enter the new dimensions:\n' +
                    'Format: `800x600` or `1920x1080`\n\n' +
                    'Common sizes:\n' +
                    '• HD: 1280x720\n' +
                    '• Full HD: 1920x1080\n' +
                    '• Square: 800x800'
                );
                break;

            case 'edit_add_text':
                session.awaitingText = true;
                await this.bot.editMessageText(chatId, messageId,
                    '📝 **Add Text Overlay**\n\n' +
                    'Please enter the text you want to add:\n\n' +
                    '• Text will be centered on the image\n' +
                    '• Keep it short for best results\n\n' +
                    'Type your text now:'
                );
                break;

            case 'edit_rotate':
                await this.bot.editMessageText(chatId, messageId, '🔄 Rotating image 90° clockwise...');
                await this.bot.sendMessage(chatId, '✅ Image rotated 90°! (Processing simulated)');
                break;

            case 'edit_new':
                session.currentImage = null;
                await this.bot.editMessageText(chatId, messageId, '📤 Please send me a new image to edit!');
                break;

            case 'edit_cancel':
                session.currentImage = null;
                await this.bot.editMessageText(chatId, messageId, '❌ Editing cancelled. Send /edit to start again.');
                break;
        }
    }

    async handleText(update) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        const session = this.getUserSession(chatId);

        if (text.startsWith('/start')) {
            return await this.handleStart(chatId);
        } else if (text.startsWith('/edit')) {
            return await this.handleEdit(chatId);
        } else if (text.startsWith('/help')) {
            return await this.handleHelp(chatId);
        } else if (session.awaitingText) {
            session.awaitingText = false;
            await this.bot.sendMessage(chatId, `⏳ Adding text "${text}" to your image...`);
            await this.bot.sendMessage(chatId, `✅ Text "${text}" added! (Processing simulated)`);
        } else if (session.awaitingDimensions) {
            const dimensions = text.split(/[x×,\s]+/).map(d => parseInt(d.trim()));
            
            if (dimensions.length !== 2 || dimensions.some(d => isNaN(d) || d <= 0)) {
                return await this.bot.sendMessage(chatId, '❌ Invalid format. Please enter dimensions like: 800x600');
            }
            
            const [width, height] = dimensions;
            session.awaitingDimensions = false;
            
            await this.bot.sendMessage(chatId, `⏳ Resizing image to ${width}×${height}...`);
            await this.bot.sendMessage(chatId, `✅ Image resized to ${width}×${height}! (Processing simulated)`);
        } else {
            await this.bot.sendMessage(chatId, '🤔 Send /edit to start editing an image, or /help for assistance.');
        }
    }

    async handleUpdate(update) {
        try {
            if (update.message) {
                if (update.message.photo) {
                    await this.handlePhoto(update);
                } else if (update.message.text) {
                    await this.handleText(update);
                }
            } else if (update.callback_query) {
                await this.handleCallbackQuery(update);
            }
        } catch (error) {
            console.error('Error handling update:', error);
            if (update.message) {
                await this.bot.sendMessage(update.message.chat.id, '❌ An error occurred. Please try again.');
            }
        }
    }
}

// Cloudflare Workers fetch handler
export default {
    async fetch(request, env, ctx) {
        const BOT_TOKEN = env.BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return new Response('Bot token not configured', { status: 500 });
        }
        
        const workerBot = new WorkerBot(BOT_TOKEN);
        
        // Handle webhook
        if (request.method === 'POST') {
            try {
                const update = await request.json();
                await workerBot.handleUpdate(update);
                return new Response('OK');
            } catch (error) {
                console.error('Error handling update:', error);
                return new Response('Error', { status: 500 });
            }
        }
        
        // Handle GET requests (for health checks)
        if (request.method === 'GET') {
            const url = new URL(request.url);
            
            if (url.pathname === '/') {
                return new Response('🤖 Telegram AI Image Editor Bot is running on Cloudflare Workers!\n\n✅ Status: Online\n🌍 Global deployment active', {
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
            
            if (url.pathname === '/health') {
                return new Response(JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        return new Response('Method not allowed', { status: 405 });
    }
};
