# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-slim AS production

# Install ffmpeg for thumbnail generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install backend dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy server code
COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create data directory
RUN mkdir -p /app/data/videos /app/data/thumbnails

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
