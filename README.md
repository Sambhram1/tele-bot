# Telegram AI Image Editor Bot

A production-ready Telegram bot that performs AI-powered image editing including background removal, upscaling, and basic image manipulations.

## Features

- **Background Removal**: Remove backgrounds from images using AI
- **Image Upscaling**: Enhance image resolution (simulated with sharp)
- **Basic Edits**: Grayscale, rotate, resize, and add text overlays
- **User-friendly Interface**: Inline keyboard for easy operation
- **Error Handling**: Comprehensive error handling for all operations
- **Temporary Storage**: Auto-cleanup of processed images

## Prerequisites

- Node.js 16.0.0 or higher
- A Telegram Bot Token (get one from [@BotFather](https://t.me/botfather))
- Optional: `rembg` CLI tool for advanced background removal

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   echo "BOT_TOKEN=your_telegram_bot_token_here" > .env
   ```

4. (Optional) Install rembg for better background removal:
   ```bash
   pip install rembg
   ```

## Usage

1. Start the bot:
   ```bash
   npm start
   ```

2. For development with auto-restart:
   ```bash
   npm run dev
   ```

3. In Telegram, start a conversation with your bot:
   - Send `/start` to see welcome message
   - Send `/edit` to begin image editing
   - Upload an image and choose from the editing options

## Bot Commands

- `/start` - Welcome message and instructions
- `/edit` - Start image editing process
- `/help` - Show help information

## Image Editing Options

- **Remove Background** - AI-powered background removal
- **Grayscale** - Convert image to grayscale
- **Resize** - Resize image to different dimensions
- **Add Text** - Add custom text overlay
- **Upscale** - Enhance image resolution
- **Rotate** - Rotate image by specified degrees

## Project Structure

```
telegram-ai-image-editor/
├── index.js          # Main entry point
├── bot.js             # Bot configuration and handlers
├── imageUtils.js      # Image processing utilities
├── temp/              # Temporary file storage (auto-created)
├── package.json       # Project dependencies
├── .env               # Environment variables (create this)
└── README.md          # This file
```

## Environment Variables

- `BOT_TOKEN` - Your Telegram bot token (required)
- `PORT` - Port for webhook (optional, defaults to 3000)

## Error Handling

The bot includes comprehensive error handling for:
- Invalid file formats
- Network issues
- Image processing failures
- Missing dependencies
- File system errors

## Security Notes

- Images are stored temporarily and automatically deleted
- No user data is permanently stored
- Bot token should be kept secure in `.env` file
- Add `.env` to `.gitignore` if using version control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please create an issue in the repository or contact the maintainer.
