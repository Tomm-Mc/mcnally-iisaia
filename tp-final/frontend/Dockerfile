# --- Stage 1: build ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: runtime ---
FROM nginx:alpine AS runtime

# Certificado autofirmado para servir por HTTPS (requisito del micrófono fuera de localhost).
RUN apk add --no-cache openssl   && mkdir -p /etc/nginx/certs   && openssl req -x509 -nodes -newkey rsa:2048 -days 825 -subj "/CN=charla.local"     -keyout /etc/nginx/certs/charla.key -out /etc/nginx/certs/charla.crt

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:80 || exit 1
