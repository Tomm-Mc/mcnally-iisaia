# --- Stage 1: build ---
FROM node:20-alpine AS build
WORKDIR /app
# Prisma necesita libssl para el motor de schema/query engine en Alpine.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.seed.json ./
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

# --- Stage 2: runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
