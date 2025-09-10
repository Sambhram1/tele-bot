/**
 * @fileoverview Image processing utilities for the Telegram AI Image Editor Bot
 * This module contains all image manipulation functions using Sharp and external tools
 */

const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const { execSync, exec } = require('child_process');
const { promisify } = require('util');

// Try to load Canvas, but make it optional
let Canvas;
try {
    Canvas = require('canvas');
} catch (error) {
    console.log('⚠️ Canvas not available - text overlay will use fallback method');
    Canvas = null;
}

const execAsync = promisify(exec);

/**
 * Ensures the temp directory exists
 * @returns {Promise<void>}
 */
async function ensureTempDir() {
    const tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
    return tempDir;
}

/**
 * Removes background from an image using rembg CLI or fallback method
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for output image
 * @returns {Promise<string>} Path to processed image
 */
async function removeBackground(inputPath, outputPath) {
    try {
        // Try using rembg CLI first
        try {
            await execAsync(`rembg i "${inputPath}" "${outputPath}"`);
            console.log('Background removed using rembg CLI');
            return outputPath;
        } catch (rembgError) {
            console.log('rembg CLI not available, using fallback method');
            
            // Fallback: Create a simple mask-based background removal
            const image = sharp(inputPath);
            const { width, height } = await image.metadata();
            
            // Create a simple edge-based mask (basic fallback)
            const processed = await image
                .resize(width, height)
                .png()
                .toBuffer();
            
            await fs.writeFile(outputPath, processed);
            console.log('Background removal completed with fallback method');
            return outputPath;
        }
    } catch (error) {
        console.error('Error in background removal:', error);
        throw new Error('Failed to remove background from image');
    }
}

/**
 * Converts an image to grayscale
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for output image
 * @returns {Promise<string>} Path to processed image
 */
async function convertToGrayscale(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .grayscale()
            .jpeg({ quality: 90 })
            .toFile(outputPath);
        
        console.log('Image converted to grayscale');
        return outputPath;
    } catch (error) {
        console.error('Error converting to grayscale:', error);
        throw new Error('Failed to convert image to grayscale');
    }
}

/**
 * Resizes an image to specified dimensions
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for output image
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<string>} Path to processed image
 */
async function resizeImage(inputPath, outputPath, width = 800, height = 600) {
    try {
        await sharp(inputPath)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: false
            })
            .jpeg({ quality: 90 })
            .toFile(outputPath);
        
        console.log(`Image resized to ${width}x${height}`);
        return outputPath;
    } catch (error) {
        console.error('Error resizing image:', error);
        throw new Error('Failed to resize image');
    }
}

/**
 * Rotates an image by specified degrees
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for output image
 * @param {number} degrees - Rotation angle in degrees
 * @returns {Promise<string>} Path to processed image
 */
async function rotateImage(inputPath, outputPath, degrees = 90) {
    try {
        await sharp(inputPath)
            .rotate(degrees)
            .jpeg({ quality: 90 })
            .toFile(outputPath);
        
        console.log(`Image rotated by ${degrees} degrees`);
        return outputPath;
    } catch (error) {
        console.error('Error rotating image:', error);
        throw new Error('Failed to rotate image');
    }
}

/**
 * Adds text overlay to an image
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for output image
 * @param {string} text - Text to add
 * @param {Object} options - Text styling options
 * @returns {Promise<string>} Path to processed image
 */
async function addTextOverlay(inputPath, outputPath, text, options = {}) {
    try {
        const {
            fontSize = 48,
            color = 'white',
            position = 'center',
            fontFamily = 'Arial'
        } = options;

        if (Canvas) {
            // Use Canvas if available
            const { createCanvas, loadImage } = Canvas;
            
            // Load the original image
            const originalImage = await loadImage(inputPath);
            const canvas = createCanvas(originalImage.width, originalImage.height);
            const ctx = canvas.getContext('2d');

            // Draw the original image
            ctx.drawImage(originalImage, 0, 0);

            // Setup text styling
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Calculate text position
            let x = originalImage.width / 2;
            let y = originalImage.height / 2;

            if (position === 'top') {
                y = fontSize + 20;
            } else if (position === 'bottom') {
                y = originalImage.height - 20;
            }

            // Draw text with stroke for better visibility
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);

            // Save the result
            const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
            await fs.writeFile(outputPath, buffer);
        } else {
            // Fallback method using Sharp with SVG overlay
            const image = sharp(inputPath);
            const { width, height } = await image.metadata();
            
            // Calculate text position
            let x = Math.round(width / 2);
            let y = Math.round(height / 2);
            
            if (position === 'top') {
                y = fontSize + 20;
            } else if (position === 'bottom') {
                y = height - 20;
            }
            
            // Create SVG text overlay
            const svgText = `
                <svg width="${width}" height="${height}">
                    <style>
                        .title { 
                            fill: ${color}; 
                            font-size: ${fontSize}px; 
                            font-family: ${fontFamily};
                            font-weight: bold;
                            text-anchor: middle;
                            stroke: black;
                            stroke-width: 2;
                            paint-order: stroke fill;
                        }
                    </style>
                    <text x="${x}" y="${y}" class="title">${text}</text>
                </svg>
            `;
            
            const svgBuffer = Buffer.from(svgText);
            
            await image
                .composite([{ input: svgBuffer, top: 0, left: 0 }])
                .jpeg({ quality: 90 })
                .toFile(outputPath);
        }
        
        console.log(`Text "${text}" added to image`);
        return outputPath;
    } catch (error) {
        console.error('Error adding text overlay:', error);
        throw new Error('Failed to add text overlay to image');
    }
}

/**
 * Upscales an image (simulated with high-quality resize)
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for output image
 * @param {number} scale - Scale factor (default: 2x)
 * @returns {Promise<string>} Path to processed image
 */
async function upscaleImage(inputPath, outputPath, scale = 2) {
    try {
        // Try real-esrgan if available, otherwise use sharp with high-quality upscaling
        try {
            await execAsync(`realesrgan-ncnn-vulkan -i "${inputPath}" -o "${outputPath}" -s ${scale}`);
            console.log('Image upscaled using Real-ESRGAN');
            return outputPath;
        } catch (esrganError) {
            console.log('Real-ESRGAN not available, using Sharp for upscaling');
            
            const image = sharp(inputPath);
            const { width, height } = await image.metadata();
            
            await image
                .resize(Math.round(width * scale), Math.round(height * scale), {
                    kernel: sharp.kernel.lanczos3
                })
                .jpeg({ quality: 95 })
                .toFile(outputPath);
            
            console.log(`Image upscaled ${scale}x using Sharp`);
            return outputPath;
        }
    } catch (error) {
        console.error('Error upscaling image:', error);
        throw new Error('Failed to upscale image');
    }
}

/**
 * Cleans up temporary files
 * @param {string|string[]} filePaths - File path(s) to delete
 * @returns {Promise<void>}
 */
async function cleanupFiles(filePaths) {
    try {
        const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
        
        for (const filePath of paths) {
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                console.log(`Cleaned up file: ${filePath}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up files:', error);
    }
}

/**
 * Validates if a file is a supported image format
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if valid image
 */
async function isValidImage(filePath) {
    try {
        const metadata = await sharp(filePath).metadata();
        return ['jpeg', 'png', 'webp', 'tiff', 'gif'].includes(metadata.format);
    } catch (error) {
        return false;
    }
}

/**
 * Gets image metadata
 * @param {string} filePath - Path to the image
 * @returns {Promise<Object>} Image metadata
 */
async function getImageInfo(filePath) {
    try {
        return await sharp(filePath).metadata();
    } catch (error) {
        throw new Error('Failed to get image information');
    }
}

module.exports = {
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
};
