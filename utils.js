/**
 * @fileoverview Utility functions for the Telegram AI Image Editor Bot
 */

const fs = require('fs-extra');
const path = require('path');
const config = require('./config');

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates if a file size is within limits
 * @param {number} size - File size in bytes
 * @returns {boolean} True if valid
 */
function isValidFileSize(size) {
    return size <= config.bot.maxFileSize;
}

/**
 * Gets file extension from filename
 * @param {string} filename - The filename
 * @returns {string} File extension (lowercase, without dot)
 */
function getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
}

/**
 * Validates if a file format is supported
 * @param {string} filename - The filename
 * @returns {boolean} True if supported
 */
function isSupportedFormat(filename) {
    const ext = getFileExtension(filename);
    return config.bot.supportedFormats.includes(ext);
}

/**
 * Generates a unique filename with timestamp and UUID
 * @param {string} originalName - Original filename
 * @param {string} suffix - Optional suffix to add
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, suffix = '') {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    
    return `${baseName}_${suffix}_${timestamp}_${randomId}${ext}`;
}

/**
 * Cleans up old files in a directory
 * @param {string} dirPath - Directory path
 * @param {number} maxAge - Maximum age in milliseconds
 */
async function cleanupOldFiles(dirPath, maxAge = config.development.cleanupInterval) {
    try {
        if (!(await fs.pathExists(dirPath))) {
            return;
        }

        const files = await fs.readdir(dirPath);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                await fs.remove(filePath);
                console.log(`🗑️ Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up old files:', error);
    }
}

/**
 * Starts automatic cleanup process
 */
function startAutoCleanup() {
    setInterval(async () => {
        await cleanupOldFiles(config.paths.tempDir);
    }, config.development.cleanupInterval);
    
    console.log('🧹 Auto-cleanup process started');
}

/**
 * Logs debug information if debug mode is enabled
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
    if (config.development.debug) {
        console.log('🐛 DEBUG:', ...args);
    }
}

/**
 * Validates and sanitizes user input
 * @param {string} input - User input
 * @param {Object} options - Validation options
 * @returns {string|null} Sanitized input or null if invalid
 */
function sanitizeInput(input, options = {}) {
    const {
        maxLength = 100,
        allowedChars = /^[a-zA-Z0-9\s\-_.,!?()]+$/,
        trim = true
    } = options;

    if (typeof input !== 'string') {
        return null;
    }

    let sanitized = trim ? input.trim() : input;

    if (sanitized.length === 0 || sanitized.length > maxLength) {
        return null;
    }

    if (!allowedChars.test(sanitized)) {
        return null;
    }

    return sanitized;
}

/**
 * Creates a progress callback for long operations
 * @param {Object} ctx - Telegraf context
 * @param {string} baseMessage - Base message to update
 * @returns {Function} Progress callback function
 */
function createProgressCallback(ctx, baseMessage) {
    let lastUpdate = 0;
    const updateInterval = 2000; // Update every 2 seconds
    
    return async (progress) => {
        const now = Date.now();
        if (now - lastUpdate > updateInterval) {
            try {
                const percentage = Math.round(progress * 100);
                await ctx.editMessageText(`${baseMessage} ${percentage}%`);
                lastUpdate = now;
            } catch (error) {
                // Ignore errors from message editing (likely rate limiting)
            }
        }
    };
}

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
function safeJSONParse(jsonString, defaultValue = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        debugLog('JSON parsing failed:', error);
        return defaultValue;
    }
}

/**
 * Escapes markdown special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Validates image dimensions
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {boolean} True if dimensions are valid
 */
function isValidDimensions(width, height) {
    return (
        width > 0 && 
        height > 0 && 
        width <= config.image.maxWidth && 
        height <= config.image.maxHeight
    );
}

/**
 * Calculates aspect ratio preserving dimensions
 * @param {number} originalWidth - Original width
 * @param {number} originalHeight - Original height
 * @param {number} targetWidth - Target width
 * @param {number} targetHeight - Target height
 * @returns {Object} Calculated dimensions
 */
function calculateAspectRatioDimensions(originalWidth, originalHeight, targetWidth, targetHeight) {
    const originalRatio = originalWidth / originalHeight;
    const targetRatio = targetWidth / targetHeight;
    
    let newWidth, newHeight;
    
    if (originalRatio > targetRatio) {
        newWidth = targetWidth;
        newHeight = Math.round(targetWidth / originalRatio);
    } else {
        newHeight = targetHeight;
        newWidth = Math.round(targetHeight * originalRatio);
    }
    
    return { width: newWidth, height: newHeight };
}

module.exports = {
    formatFileSize,
    isValidFileSize,
    getFileExtension,
    isSupportedFormat,
    generateUniqueFilename,
    cleanupOldFiles,
    startAutoCleanup,
    debugLog,
    sanitizeInput,
    createProgressCallback,
    safeJSONParse,
    escapeMarkdown,
    isValidDimensions,
    calculateAspectRatioDimensions
};
