#!/bin/sh
set -e

echo "📦 Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "🌱 Corriendo seed (idempotente)..."
node dist/prisma/seed.js

echo "🚀 Iniciando servidor..."
exec node dist/index.js
