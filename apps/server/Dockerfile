# ==============================================================
# Backend Dockerfile
# ==============================================================
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ---- Development ----
FROM base AS development
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---- Builder ----
FROM base AS builder
COPY package*.json ./
RUN npm ci --only=production && cp -r node_modules prod_modules
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 5000
USER node
CMD ["node", "dist/index.js"]
