/**
 * @fileoverview Test script for the Telegram AI Image Editor Bot
 * Basic tests to verify functionality
 */

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// Import modules to test
const { 
    ensureTempDir, 
    convertToGrayscale, 
    resizeImage, 
    isValidImage,
    getImageInfo
} = require('./imageUtils');

const { 
    formatFileSize, 
    generateUniqueFilename, 
    sanitizeInput,
    isValidDimensions
} = require('./utils');

/**
 * Test image utilities
 */
async function testImageUtils() {
    console.log('🧪 Testing Image Utilities...');
    
    try {
        // Test temp directory creation
        const tempDir = await ensureTempDir();
        console.log('✅ Temp directory created:', tempDir);
        
        // Create a test image
        const testImagePath = path.join(tempDir, 'test.jpg');
        await sharp({
            create: {
                width: 300,
                height: 200,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
            }
        })
        .jpeg()
        .toFile(testImagePath);
        
        console.log('✅ Test image created');
        
        // Test image validation
        const isValid = await isValidImage(testImagePath);
        console.log('✅ Image validation:', isValid);
        
        // Test image info
        const info = await getImageInfo(testImagePath);
        console.log('✅ Image info:', info.width, 'x', info.height);
        
        // Test grayscale conversion
        const grayscalePath = path.join(tempDir, 'test_grayscale.jpg');
        await convertToGrayscale(testImagePath, grayscalePath);
        console.log('✅ Grayscale conversion completed');
        
        // Test resize
        const resizedPath = path.join(tempDir, 'test_resized.jpg');
        await resizeImage(testImagePath, resizedPath, 150, 100);
        console.log('✅ Image resize completed');
        
        // Cleanup test files
        await fs.remove(testImagePath);
        await fs.remove(grayscalePath);
        await fs.remove(resizedPath);
        console.log('✅ Test files cleaned up');
        
    } catch (error) {
        console.error('❌ Image utils test failed:', error);
        return false;
    }
    
    return true;
}

/**
 * Test utility functions
 */
function testUtils() {
    console.log('\n🧪 Testing Utility Functions...');
    
    try {
        // Test file size formatting
        const size1 = formatFileSize(1024);
        const size2 = formatFileSize(1048576);
        console.log('✅ File size formatting:', size1, size2);
        
        // Test filename generation
        const filename = generateUniqueFilename('test.jpg', 'processed');
        console.log('✅ Unique filename generated:', filename);
        
        // Test input sanitization
        const sanitized1 = sanitizeInput('Hello World!', { maxLength: 50 });
        const sanitized2 = sanitizeInput('<script>alert("test")</script>');
        console.log('✅ Input sanitization:', sanitized1, sanitized2);
        
        // Test dimension validation
        const valid1 = isValidDimensions(800, 600);
        const valid2 = isValidDimensions(5000, 5000);
        console.log('✅ Dimension validation:', valid1, valid2);
        
        return true;
        
    } catch (error) {
        console.error('❌ Utils test failed:', error);
        return false;
    }
}

/**
 * Test bot configuration
 */
function testConfig() {
    console.log('\n🧪 Testing Configuration...');
    
    try {
        const config = require('./config');
        
        // Check if config has required properties
        const requiredProps = ['bot', 'image', 'paths', 'tools'];
        for (const prop of requiredProps) {
            if (!config[prop]) {
                throw new Error(`Missing config property: ${prop}`);
            }
        }
        
        console.log('✅ Configuration validation passed');
        console.log('✅ Max file size:', formatFileSize(config.bot.maxFileSize));
        console.log('✅ Supported formats:', config.bot.supportedFormats.join(', '));
        
        return true;
        
    } catch (error) {
        console.error('❌ Config test failed:', error);
        return false;
    }
}

/**
 * Test environment setup
 */
function testEnvironment() {
    console.log('\n🧪 Testing Environment...');
    
    try {
        // Check for required dependencies
        const requiredModules = [
            'telegraf',
            'sharp',
            'dotenv',
            'fs-extra',
            'uuid'
        ];
        
        // Optional dependencies
        const optionalModules = [
            'canvas'
        ];
        
        for (const module of requiredModules) {
            try {
                require(module);
                console.log(`✅ ${module} available`);
            } catch (error) {
                console.log(`❌ ${module} missing`);
                return false;
            }
        }
        
        for (const module of optionalModules) {
            try {
                require(module);
                console.log(`✅ ${module} available (optional)`);
            } catch (error) {
                console.log(`⚠️ ${module} not available (optional - fallback will be used)`);
            }
        }
        
        // Check .env file
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            console.log('✅ .env file found');
        } else {
            console.log('⚠️ .env file not found (run setup.js)');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Environment test failed:', error);
        return false;
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('🧪 Running Telegram AI Image Editor Bot Tests\n');
    
    const tests = [
        { name: 'Environment', fn: testEnvironment },
        { name: 'Configuration', fn: testConfig },
        { name: 'Utilities', fn: testUtils },
        { name: 'Image Utils', fn: testImageUtils }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
                console.log(`✅ ${test.name} tests passed`);
            } else {
                failed++;
                console.log(`❌ ${test.name} tests failed`);
            }
        } catch (error) {
            failed++;
            console.log(`❌ ${test.name} tests failed:`, error.message);
        }
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! The bot should work correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the issues above.');
    }
    
    return failed === 0;
}

if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runTests };
