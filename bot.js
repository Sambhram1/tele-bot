/**
 * @fileoverview Telegram bot configuration and message handlers
 * This module contains the main bot logic, command handlers, and user interaction flow
 */

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const {
    ensureTempDir,
    removeBackground,
    convertToGrayscale,
    resizeImage,
    rotateImage,
    addTextOverlay,
    upscaleImage,
    cleanupFiles,
    isValidImage,
    getImageInfo
} = require('./imageUtils');

const {
    formatFileSize,
    isValidFileSize,
    isSupportedFormat,
    generateUniqueFilename,
    sanitizeInput,
    debugLog,
    escapeMarkdown,
    isValidDimensions
} = require('./utils');

const config = require('./config');

/**
 * Creates and configures the Telegram bot
 * @param {string} token - Telegram bot token
 * @returns {Telegraf} Configured bot instance
 */
function createBot(token) {
    const bot = new Telegraf(token);

    // Store user sessions for multi-step operations
    const userSessions = new Map();

    /**
     * Helper function to get or create user session
     * @param {number} userId - Telegram user ID
     * @returns {Object} User session object
     */
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

    /**
     * Downloads a file from Telegram servers
     * @param {Object} ctx - Telegraf context
     * @param {string} fileId - Telegram file ID
     * @returns {Promise<string>} Path to downloaded file
     */
    async function downloadFile(ctx, fileId) {
        try {
            const fileInfo = await ctx.telegram.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
            
            const tempDir = await ensureTempDir();
            const fileName = `${uuidv4()}.${fileInfo.file_path.split('.').pop()}`;
            const filePath = path.join(tempDir, fileName);
            
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream'
            });
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error('Failed to download image');
        }
    }

    /**
     * Creates the main editing keyboard
     * @returns {Object} Inline keyboard markup
     */
    function createEditingKeyboard() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🖼️ Remove Background', 'edit_remove_bg'),
                Markup.button.callback('⚫ Grayscale', 'edit_grayscale')
            ],
            [
                Markup.button.callback('📏 Resize', 'edit_resize'),
                Markup.button.callback('🔄 Rotate', 'edit_rotate')
            ],
            [
                Markup.button.callback('📝 Add Text', 'edit_add_text'),
                Markup.button.callback('⬆️ Upscale', 'edit_upscale')
            ],
            [
                Markup.button.callback('🆕 New Image', 'edit_new'),
                Markup.button.callback('❌ Cancel', 'edit_cancel')
            ]
        ]);
    }

    // Command handlers

    /**
     * /start command handler
     */
    bot.start(async (ctx) => {
        const welcomeMessage = `
🤖 **Welcome to AI Image Editor Bot!**

I can help you edit images with AI-powered tools and basic editing features.

**Available Features:**
🖼️ Background Removal (AI-powered)
⚫ Grayscale Conversion
📏 Image Resizing
🔄 Image Rotation
📝 Text Overlays
⬆️ Image Upscaling

**How to use:**
1. Send /edit command
2. Upload an image (JPG, PNG, WebP)
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

    /**
     * /edit command handler
     */
    bot.command('edit', async (ctx) => {
        const session = getUserSession(ctx.from.id);
        session.currentImage = null;
        session.awaitingText = false;
        session.awaitingDimensions = false;
        session.awaitingRotation = false;

        await ctx.reply(
            '📤 Please send me an image to edit!\n\n' +
            'Supported formats: JPG, PNG, WebP, TIFF, GIF\n' +
            'Maximum file size: 20MB'
        );
    });

    /**
     * /help command handler
     */
    bot.help(async (ctx) => {
        const helpMessage = `
🆘 **Help - AI Image Editor Bot**

**Available Editing Options:**

🖼️ **Remove Background**
- AI-powered background removal
- Works best with clear subjects
- Uses rembg or fallback algorithm

⚫ **Grayscale**
- Convert colored images to black & white
- Preserves image quality

📏 **Resize**
- Change image dimensions
- Maintains aspect ratio option
- Custom width and height

🔄 **Rotate**
- Rotate images by any angle
- Common presets: 90°, 180°, 270°
- Custom rotation angles

📝 **Add Text**
- Overlay custom text on images
- Choose position (top, center, bottom)
- Customizable font size and color

⬆️ **Upscale**
- Enhance image resolution
- 2x, 3x, or 4x scaling options
- AI-enhanced when available

**Tips:**
- Use high-quality source images for best results
- Background removal works better with clear subjects
- Text overlays work best on images with space
- Upscaling may take longer for large images

**Commands:**
/start - Welcome message
/edit - Start editing
/help - This help message

Need support? Contact the bot administrator.
        `;

        await ctx.replyWithMarkdown(helpMessage);
    });

    // Image upload handler
    bot.on('photo', async (ctx) => {
        try {
            const session = getUserSession(ctx.from.id);
            
            // Get the highest resolution photo
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            
            await ctx.reply('⏳ Downloading your image...');
            
            const filePath = await downloadFile(ctx, photo.file_id);
            
            // Validate image
            if (!(await isValidImage(filePath))) {
                await cleanupFiles(filePath);
                return ctx.reply('❌ Invalid image format. Please send a valid image file.');
            }
            
            // Get image info
            const imageInfo = await getImageInfo(filePath);
            session.currentImage = filePath;
            
            const infoMessage = `
✅ **Image received and ready for editing!**

📊 **Image Information:**
• Format: ${imageInfo.format?.toUpperCase()}
• Dimensions: ${imageInfo.width} × ${imageInfo.height} pixels
• File size: ${Math.round(imageInfo.size / 1024)} KB
• Color space: ${imageInfo.space}

Choose an editing option below:
            `;
            
            await ctx.replyWithMarkdown(infoMessage, createEditingKeyboard());
            
        } catch (error) {
            console.error('Error processing image:', error);
            await ctx.reply('❌ Error processing your image. Please try again.');
        }
    });

    // Document (file) upload handler
    bot.on('document', async (ctx) => {
        try {
            const document = ctx.message.document;
            
            // Check if it's an image file
            if (!document.mime_type?.startsWith('image/')) {
                return ctx.reply('❌ Please send an image file (JPG, PNG, WebP, etc.).');
            }
            
            const session = getUserSession(ctx.from.id);
            
            await ctx.reply('⏳ Downloading your image...');
            
            const filePath = await downloadFile(ctx, document.file_id);
            
            // Validate image
            if (!(await isValidImage(filePath))) {
                await cleanupFiles(filePath);
                return ctx.reply('❌ Invalid image format. Please send a valid image file.');
            }
            
            const imageInfo = await getImageInfo(filePath);
            session.currentImage = filePath;
            
            const infoMessage = `
✅ **Image received and ready for editing!**

📊 **Image Information:**
• Format: ${imageInfo.format?.toUpperCase()}
• Dimensions: ${imageInfo.width} × ${imageInfo.height} pixels
• File size: ${Math.round((await fs.stat(filePath)).size / 1024)} KB

Choose an editing option below:
            `;
            
            await ctx.replyWithMarkdown(infoMessage, createEditingKeyboard());
            
        } catch (error) {
            console.error('Error processing document:', error);
            await ctx.reply('❌ Error processing your file. Please try again.');
        }
    });

    // Text input handler for various operations
    bot.on('text', async (ctx) => {
        const session = getUserSession(ctx.from.id);
        
        if (session.awaitingText) {
            await handleTextInput(ctx, session);
        } else if (session.awaitingDimensions) {
            await handleDimensionsInput(ctx, session);
        } else if (session.awaitingRotation) {
            await handleRotationInput(ctx, session);
        } else {
            // Default response for unrecognized text
            await ctx.reply(
                '🤔 I don\'t understand that command.\n\n' +
                'Send /edit to start editing an image, or /help for assistance.'
            );
        }
    });

    /**
     * Handles text input for adding text overlay
     */
    async function handleTextInput(ctx, session) {
        try {
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first with /edit');
            }

            const rawText = ctx.message.text;
            const text = sanitizeInput(rawText, { 
                maxLength: 100, 
                allowedChars: /^[a-zA-Z0-9\s\-_.,!?()'"]+$/
            });

            if (!text) {
                return ctx.reply('❌ Invalid text. Please use only letters, numbers, and basic punctuation (max 100 characters)');
            }

            session.awaitingText = false;

            await ctx.reply('⏳ Adding text to your image...');
            debugLog('Adding text overlay:', text);

            const tempDir = await ensureTempDir();
            const outputPath = path.join(tempDir, generateUniqueFilename('text_overlay.jpg', 'text'));

            await addTextOverlay(session.currentImage, outputPath, text, {
                fontSize: config.image.textOverlay.defaultFontSize,
                color: config.image.textOverlay.defaultColor,
                position: config.image.textOverlay.defaultPosition
            });

            await ctx.replyWithPhoto({ source: outputPath }, {
                caption: `✅ Text "${escapeMarkdown(text)}" added to your image!`,
                parse_mode: 'MarkdownV2',
                ...createEditingKeyboard()
            });

            // Cleanup old image and update session
            await cleanupFiles(session.currentImage);
            session.currentImage = outputPath;

        } catch (error) {
            console.error('Error adding text:', error);
            session.awaitingText = false;
            await ctx.reply('❌ Error adding text to image. Please try again.');
        }
    }

    /**
     * Handles dimension input for resizing
     */
    async function handleDimensionsInput(ctx, session) {
        try {
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first with /edit');
            }

            const input = sanitizeInput(ctx.message.text.trim(), { 
                maxLength: 20, 
                allowedChars: /^[0-9x×,\s]+$/
            });

            if (!input) {
                return ctx.reply('❌ Invalid format. Please enter dimensions like: 800x600 or 1920×1080');
            }

            const dimensions = input.split(/[x×,\s]+/).map(d => parseInt(d.trim()));

            if (dimensions.length !== 2 || dimensions.some(d => isNaN(d) || d <= 0)) {
                return ctx.reply('❌ Invalid format. Please enter dimensions like: 800x600 or 1920×1080');
            }

            const [width, height] = dimensions;

            if (!isValidDimensions(width, height)) {
                return ctx.reply(
                    `❌ Invalid dimensions. Please use values between 1 and ${config.image.maxWidth}×${config.image.maxHeight}`
                );
            }

            session.awaitingDimensions = false;

            await ctx.reply(`⏳ Resizing image to ${width}×${height}...`);
            debugLog('Resizing image to:', width, 'x', height);

            const tempDir = await ensureTempDir();
            const outputPath = path.join(tempDir, generateUniqueFilename('resized.jpg', 'resize'));

            await resizeImage(session.currentImage, outputPath, width, height);

            await ctx.replyWithPhoto({ source: outputPath }, {
                caption: `✅ Image resized to ${width}×${height} pixels!`,
                ...createEditingKeyboard()
            });

            // Cleanup old image and update session
            await cleanupFiles(session.currentImage);
            session.currentImage = outputPath;

        } catch (error) {
            console.error('Error resizing image:', error);
            session.awaitingDimensions = false;
            await ctx.reply('❌ Error resizing image. Please try again.');
        }
    }

    /**
     * Handles rotation input
     */
    async function handleRotationInput(ctx, session) {
        try {
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first with /edit');
            }

            const input = ctx.message.text.trim();
            const degrees = parseInt(input);

            if (isNaN(degrees) || degrees < -360 || degrees > 360) {
                return ctx.reply('❌ Invalid rotation. Please enter a number between -360 and 360 degrees.');
            }

            session.awaitingRotation = false;

            await ctx.reply(`⏳ Rotating image by ${degrees} degrees...`);

            const tempDir = await ensureTempDir();
            const outputPath = path.join(tempDir, `rotated_${uuidv4()}.jpg`);

            await rotateImage(session.currentImage, outputPath, degrees);

            await ctx.replyWithPhoto({ source: outputPath }, {
                caption: `✅ Image rotated by ${degrees} degrees!`,
                ...createEditingKeyboard()
            });

            // Cleanup old image and update session
            await cleanupFiles(session.currentImage);
            session.currentImage = outputPath;

        } catch (error) {
            console.error('Error rotating image:', error);
            session.awaitingRotation = false;
            await ctx.reply('❌ Error rotating image. Please try again.');
        }
    }

    // Callback query handlers for inline buttons
    bot.action('edit_remove_bg', async (ctx) => {
        await ctx.answerCbQuery();
        await handleBackgroundRemoval(ctx);
    });

    bot.action('edit_grayscale', async (ctx) => {
        await ctx.answerCbQuery();
        await handleGrayscale(ctx);
    });

    bot.action('edit_resize', async (ctx) => {
        await ctx.answerCbQuery();
        await handleResizeRequest(ctx);
    });

    bot.action('edit_rotate', async (ctx) => {
        await ctx.answerCbQuery();
        await handleRotateRequest(ctx);
    });

    bot.action('edit_add_text', async (ctx) => {
        await ctx.answerCbQuery();
        await handleTextRequest(ctx);
    });

    bot.action('edit_upscale', async (ctx) => {
        await ctx.answerCbQuery();
        await handleUpscale(ctx);
    });

    bot.action('edit_new', async (ctx) => {
        await ctx.answerCbQuery();
        const session = getUserSession(ctx.from.id);
        if (session.currentImage) {
            await cleanupFiles(session.currentImage);
        }
        session.currentImage = null;
        await ctx.editMessageText('📤 Please send me a new image to edit!');
    });

    bot.action('edit_cancel', async (ctx) => {
        await ctx.answerCbQuery();
        const session = getUserSession(ctx.from.id);
        if (session.currentImage) {
            await cleanupFiles(session.currentImage);
        }
        session.currentImage = null;
        await ctx.editMessageText('❌ Editing cancelled. Send /edit to start again.');
    });

    // Individual editing operation handlers

    async function handleBackgroundRemoval(ctx) {
        try {
            const session = getUserSession(ctx.from.id);
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first.');
            }

            await ctx.editMessageText('⏳ Removing background... This may take a moment.');

            const tempDir = await ensureTempDir();
            const outputPath = path.join(tempDir, `no_bg_${uuidv4()}.png`);

            await removeBackground(session.currentImage, outputPath);

            await ctx.replyWithDocument({ source: outputPath }, {
                caption: '✅ Background removed! Sent as PNG to preserve transparency.',
                ...createEditingKeyboard()
            });

            // Cleanup old image and update session
            await cleanupFiles(session.currentImage);
            session.currentImage = outputPath;

        } catch (error) {
            console.error('Error removing background:', error);
            await ctx.reply('❌ Error removing background. Please try again.');
        }
    }

    async function handleGrayscale(ctx) {
        try {
            const session = getUserSession(ctx.from.id);
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first.');
            }

            await ctx.editMessageText('⏳ Converting to grayscale...');

            const tempDir = await ensureTempDir();
            const outputPath = path.join(tempDir, `grayscale_${uuidv4()}.jpg`);

            await convertToGrayscale(session.currentImage, outputPath);

            await ctx.replyWithPhoto({ source: outputPath }, {
                caption: '✅ Image converted to grayscale!',
                ...createEditingKeyboard()
            });

            // Cleanup old image and update session
            await cleanupFiles(session.currentImage);
            session.currentImage = outputPath;

        } catch (error) {
            console.error('Error converting to grayscale:', error);
            await ctx.reply('❌ Error converting image to grayscale. Please try again.');
        }
    }

    async function handleResizeRequest(ctx) {
        const session = getUserSession(ctx.from.id);
        if (!session.currentImage) {
            return ctx.reply('❌ No image found. Please send an image first.');
        }

        session.awaitingDimensions = true;
        await ctx.editMessageText(
            '📏 **Resize Image**\n\n' +
            'Please enter the new dimensions in one of these formats:\n' +
            '• `800x600`\n' +
            '• `1920×1080`\n' +
            '• `800,600`\n' +
            '• `800 600`\n\n' +
            'Common sizes:\n' +
            '• HD: 1280×720\n' +
            '• Full HD: 1920×1080\n' +
            '• 4K: 3840×2160\n' +
            '• Square: 800×800',
            { parse_mode: 'Markdown' }
        );
    }

    async function handleRotateRequest(ctx) {
        const session = getUserSession(ctx.from.id);
        if (!session.currentImage) {
            return ctx.reply('❌ No image found. Please send an image first.');
        }

        session.awaitingRotation = true;
        await ctx.editMessageText(
            '🔄 **Rotate Image**\n\n' +
            'Please enter the rotation angle in degrees:\n' +
            '• `90` - Quarter turn clockwise\n' +
            '• `-90` - Quarter turn counter-clockwise\n' +
            '• `180` - Half turn\n' +
            '• `45` - Custom angle\n\n' +
            'Enter any value between -360 and 360 degrees.',
            { parse_mode: 'Markdown' }
        );
    }

    async function handleTextRequest(ctx) {
        const session = getUserSession(ctx.from.id);
        if (!session.currentImage) {
            return ctx.reply('❌ No image found. Please send an image first.');
        }

        session.awaitingText = true;
        await ctx.editMessageText(
            '📝 **Add Text Overlay**\n\n' +
            'Please enter the text you want to add to your image:\n\n' +
            '• Text will be centered on the image\n' +
            '• White text with black outline for visibility\n' +
            '• Keep it short for best results\n\n' +
            'Type your text now:'
        );
    }

    async function handleUpscale(ctx) {
        try {
            const session = getUserSession(ctx.from.id);
            if (!session.currentImage) {
                return ctx.reply('❌ No image found. Please send an image first.');
            }

            await ctx.editMessageText('⏳ Upscaling image... This may take a moment.');

            const tempDir = await ensureTempDir();
            const outputPath = path.join(tempDir, `upscaled_${uuidv4()}.jpg`);

            await upscaleImage(session.currentImage, outputPath, 2);

            await ctx.replyWithDocument({ source: outputPath }, {
                caption: '✅ Image upscaled 2x! Sent as document to preserve quality.',
                ...createEditingKeyboard()
            });

            // Cleanup old image and update session
            await cleanupFiles(session.currentImage);
            session.currentImage = outputPath;

        } catch (error) {
            console.error('Error upscaling image:', error);
            await ctx.reply('❌ Error upscaling image. Please try again.');
        }
    }

    // Error handling middleware
    bot.catch((err, ctx) => {
        console.error('Bot error:', err);
        ctx.reply('❌ An unexpected error occurred. Please try again later.');
    });

    return bot;
}

module.exports = { createBot };
