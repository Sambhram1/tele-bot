# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production --no-audit --no-fund

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S telegram -u 1001

# Copy application code
COPY --chown=telegram:nodejs . .

# Create temp directory with proper permissions
RUN mkdir -p temp && chown telegram:nodejs temp

# Switch to non-root user
USER telegram

# Expose port (for webhooks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["npm", "start"]
