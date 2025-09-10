# 🤖 Telegram AI Image Editor Bot

## Quick Start Guide

### 1. Setup (First Time)
```bash
# Clone or download the project
cd telegram-ai-image-editor

# Install dependencies
npm install

# Run setup wizard
npm run setup
```

### 2. Get Your Bot Token
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the token provided

### 3. Start the Bot
```bash
# Production mode
npm start

# Development mode (auto-restart)
npm run dev
```

### 4. Test Your Bot
- Find your bot on Telegram
- Send `/start` to see the welcome message
- Send `/edit` and upload an image
- Try the different editing options!

## 🎨 Features

### Available Editing Options
- **🖼️ Background Removal** - AI-powered background removal using rembg or fallback
- **⚫ Grayscale** - Convert images to black and white
- **📏 Resize** - Change image dimensions (maintains aspect ratio)
- **🔄 Rotate** - Rotate images by any angle
- **📝 Add Text** - Overlay custom text with styling
- **⬆️ Upscale** - Enhance image resolution (2x scaling)

### Supported Formats
- Input: JPG, PNG, WebP, TIFF, GIF
- Output: JPG (most operations), PNG (background removal)
- Maximum file size: 20MB

## 📋 Commands

### Bot Commands
- `/start` - Welcome message and instructions
- `/edit` - Start image editing workflow
- `/help` - Show detailed help information

### NPM Scripts
- `npm start` - Start the bot
- `npm run dev` - Start with auto-restart (development)
- `npm run setup` - Guided setup wizard
- `npm test` - Run functionality tests
- `npm run check` - Alias for test

## 🔧 Advanced Setup

### Environment Variables
Create a `.env` file:
```env
BOT_TOKEN=your_telegram_bot_token_here
NODE_ENV=production
```

### Optional External Tools

#### For Better Background Removal
```bash
# Install rembg (Python required)
pip install rembg
```

#### For AI Upscaling
```bash
# Install Real-ESRGAN (if available)
# Download from: https://github.com/xinntao/Real-ESRGAN
```

## 🏗️ Project Structure
```
telegram-ai-image-editor/
├── index.js          # Main entry point
├── bot.js             # Bot handlers and logic
├── imageUtils.js      # Image processing functions
├── utils.js           # Utility functions
├── config.js          # Configuration settings
├── setup.js           # Setup wizard
├── test.js            # Test suite
├── temp/              # Temporary files (auto-created)
├── package.json       # Dependencies
├── .env               # Environment variables
├── README.md          # Documentation
└── DEPLOYMENT.md      # Deployment guide
```

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Debug Mode
Set `NODE_ENV=development` for verbose logging and auto-cleanup.

### Adding New Features
1. Add image processing functions to `imageUtils.js`
2. Add bot handlers to `bot.js`
3. Update configuration in `config.js`
4. Add tests to `test.js`

## 🔍 Troubleshooting

### Common Issues

#### Bot Not Responding
- Verify bot token in `.env` file
- Check internet connection
- Look at console logs for errors

#### Image Processing Fails
- Ensure image is in supported format
- Check file size (max 20MB)
- Verify all dependencies are installed

#### Sharp Installation Issues (Windows)
```bash
npm uninstall sharp
npm install sharp
```

#### Canvas Not Available
Canvas is optional - the bot will use SVG fallback for text overlays.

### Getting Help
1. Check console logs for error messages
2. Run `npm test` to verify setup
3. Ensure all dependencies are properly installed
4. Check that your bot token is valid

## 📈 Performance Tips

### For High Traffic
- Use webhook instead of polling
- Implement rate limiting
- Use Redis for session storage
- Scale horizontally with load balancers

### For Better Performance
- Keep images under 10MB for faster processing
- Use PNG only when transparency is needed
- Regularly clean up temporary files

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions for various platforms:
- VPS/Dedicated Server
- Heroku
- Railway
- DigitalOcean
- AWS EC2
- Docker

## 🔒 Security

- Never commit `.env` file to version control
- Keep bot token secure
- Regularly rotate tokens if compromised
- Monitor for suspicious activity
- Use HTTPS for production webhooks

## 📝 License

MIT License - Feel free to modify and use for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Run diagnostic tests with `npm test`
- Review console logs for error details

---

**Enjoy editing images with your Telegram bot! 🎨📸**
