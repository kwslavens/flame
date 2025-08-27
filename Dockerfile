FROM node:16 as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Copy all source files
COPY . .

# Build client application
RUN mkdir -p ./public ./data \
    && cd ./client \
    && npm ci --only=production \
    && npm run build \
    && cd .. \
    && mv ./client/build/* ./public \
    && rm -rf ./client

# Production stage
FROM node:16-alpine

# Copy built application
COPY --from=builder /app /app

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S flame -u 1001

# Set permissions
RUN chown -R flame:nodejs /app/data \
    && chmod -R 755 /app/data

# Expose port
EXPOSE 5005

# Environment variables
ENV NODE_ENV=production
ENV PASSWORD=flame_password

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5005/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Switch to non-root user
USER flame

# Start the application
CMD ["node", "server.js"]