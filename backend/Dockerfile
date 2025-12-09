FROM node:20 AS builder

WORKDIR /app

# Install system dependencies required by Prisma (OpenSSL)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY package.json ./
RUN npm install

# Copy sources and Prisma schema
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# --- Runtime image ---
FROM node:20 AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install system dependencies required by Prisma (OpenSSL)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/index.js"]
