FROM node:20-slim

# Install system dependencies for Playwright and Prisma
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with cache clearing and retry logic
RUN npm cache clean --force && \
    npm install --no-audit --prefer-offline || \
    (rm -rf node_modules package-lock.json && npm install --no-audit)

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

EXPOSE 8000

CMD ["npm", "start"]
