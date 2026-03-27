# ── STAGE 1: BASE ────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package*.json ./

# ── STAGE 2: DEVELOPMENT ─────────────────────────────
FROM base AS development
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ── STAGE 3: PRODUCTION ──────────────────────────────
FROM base AS production
RUN npm install --omit=dev
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]