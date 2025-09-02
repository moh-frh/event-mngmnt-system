# Multi-stage build for Event Manager App
# Stage 1: Backend build
FROM node:18.19-alpine AS backend-builder

# Set working directory
WORKDIR /app

# Copy package files for backend
COPY package*.json ./
COPY server/package*.json ./server/

# Install backend dependencies
RUN npm ci --only=production --prefix server

# Copy backend source code
COPY server/ ./server/

# Create data directory for SQLite
RUN mkdir -p server/data

# Stage 2: Frontend build
FROM node:18.19-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files for frontend
COPY client/package*.json ./client/

# Install frontend dependencies
RUN npm ci --prefix client

# Copy frontend source code
COPY client/ ./client/

# Build frontend for production
RUN npm run build --prefix client

# Stage 3: Production runtime
FROM node:18.19-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy backend dependencies and source
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server

# Copy built frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/client/build ./client/build

# Create necessary directories with proper permissions
RUN mkdir -p server/data server/uploads && \
    chown -R nodejs:nodejs server/data server/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server/index.js"]
