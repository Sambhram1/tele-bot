/**
 * @fileoverview Configuration settings for the Telegram AI Image Editor Bot
 */

module.exports = {
    // Bot settings
    bot: {
        // Maximum file size for uploads (20MB)
        maxFileSize: 20 * 1024 * 1024,
        
        // Supported image formats
        supportedFormats: ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'gif'],
        
        // Session timeout (30 minutes)
        sessionTimeout: 30 * 60 * 1000,
    },

    // Image processing settings
    image: {
        // Default JPEG quality
        jpegQuality: 90,
        
        // Default PNG compression level
        pngCompressionLevel: 6,
        
        // Maximum image dimensions for processing
        maxWidth: 4096,
        maxHeight: 4096,
        
        // Default resize dimensions
        defaultResize: {
            width: 800,
            height: 600
        },
        
        // Text overlay settings
        textOverlay: {
            defaultFontSize: 48,
            defaultColor: 'white',
            defaultPosition: 'center',
            strokeColor: 'black',
            strokeWidth: 2
        },
        
        // Upscaling settings
        upscale: {
            defaultScale: 2,
            maxScale: 4,
            kernel: 'lanczos3'
        }
    },

    // Paths
    paths: {
        tempDir: './temp',
        uploadsDir: './uploads'
    },

    // External tools
    tools: {
        // rembg CLI command
        rembgCommand: 'rembg',
        
        // Real-ESRGAN command
        realEsrganCommand: 'realesrgan-ncnn-vulkan'
    },

    // Development settings
    development: {
        // Enable debug logging
        debug: process.env.NODE_ENV !== 'production',
        
        // Auto-cleanup interval (5 minutes)
        cleanupInterval: 5 * 60 * 1000
    }
};
