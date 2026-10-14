---
name: charla-database
description: Modelo de datos, migraciones y seed de Charla (Prisma 5 + SQLite). Reglas para cambiar el schema sin romper el volumen de Docker ni el seed idempotente.
scope: backend/base-de-datos
parent: ../CLAUDE.md
applies_to:
  - "tp-final/backend/prisma/**"
orm: Prisma 5 (prisma-client-js)
database: SQLite
commands:
  new_migration: npx prisma migrate dev --name <nombre_en_snake_case>
  apply: npx prisma migrate deploy
  generate: npx prisma generate
  seed: npm run seed
  studio: npx prisma studio
last_reviewed: 2026-10-14
---

# Base de datos — Prisma + SQLite

## Modelo

```
User 1─* Session *─1 Scenario
User 1─* Exercise
User 1─* DailyUsage        (@@unique [userId, date])
User 1─* LoginEvent       (userId opcional: null si el email no existe; onDelete SetNull)
Session 1─* Message 1─* Correction
```

- Todas las relaciones hijas tienen `onDelete: Cascade`.
- IDs `cuid()` como `String`.
- Campos "enum" como `String` (SQLite no soporta `enum` en Prisma). Valores permitidos en `src/schemas/enums.ts`:
  `User.level`, `Scenario.level` (`A2|B1|B2`) · `Session.status` (`active|finished`) · `Message.role` (`user|assistant`) · `Correction.category`, `Exercise.category` (`ERROR_CATEGORIES`) · `Exercise.type` (`fill_blank|fix_sentence|translate`).
- `Session.summary` es JSON stringificado (`{ score, strengths, improvements, tip }`).
- `DailyUsage.date` es `YYYY-MM-DD` en UTC.
- `User.role` (`student|admin`, default `student`). El admin tiene `level` porque el campo es obligatorio, pero no se usa.
- `Message.inputMode` (`text|voice`, default `text`): con qué modo se mandó el mensaje del usuario; alimenta la métrica de uso del modo voz.
- `LoginEvent`: un registro por intento de login (`outcome`: `success|invalid_credentials|blocked`, más `ip` y `userAgent`) para el panel de admin. Índices por `createdAt` y `userId`.
- **No está en la base, a propósito**: el **contador** de intentos fallidos que decide el bloqueo (en memoria, `src/lib/loginAttempts.ts`; el historial sí queda en `LoginEvent`) y las transcripciones/audios del modo voz (sólo se persiste el mensaje de texto resultante).

## Cambiar el schema

1. Editá `schema.prisma`. Si agregás un campo "enum", dejá el comentario `// valor1 | valor2` al lado, como los existentes, y sumá la unión en `enums.ts`.
2. Generá la migración **siempre con nombre**: `npx prisma migrate dev --name add_sentence_to_exercise` (exportá antes `DATABASE_URL="file:./data/dev.db"`).
3. Commiteá `schema.prisma` **y** la carpeta nueva en `migrations/` juntos.
4. Columnas nuevas en tablas con datos: con default o nullable. El volumen `charla-data` de los usuarios ya tiene filas, y `migrate deploy` corre en cada arranque del contenedor.
5. Corré `npm run typecheck` (el cliente de Prisma regenerado puede romper tipos en routes/services).

Reglas:

- **Nunca edites ni borres una migración ya commiteada** (`migrations/2026..._init/` incluida). Para corregir, creá una migración nueva.
- No uses `prisma db push` ni `migrate reset` para cambios que se van a commitear; sólo `migrate dev`.
- `migration_lock.toml` fija `provider = "sqlite"`; si algún día se migra a Postgres hay que regenerar las migraciones (ver nota al tope de `schema.prisma`).
- Agregá `@@index` en toda FK por la que se consulte (como `userId`, `sessionId`, `messageId`).

## Seed (`seed.ts`)

Se ejecuta en **cada** arranque del contenedor (`entrypoint.sh` → `node dist/prisma/seed.js`), por lo que **tiene que ser idempotente**:

- Usuarios: `upsert` por `email` (incluye `admin@charla.dev` con `role: 'admin'`). Escenarios: `upsert` por `slug`.
- Accesos de demo (`seedLoginHistory`): un login exitoso por cada día con sesiones de cada estudiante, más dos fallidos. Sólo si la tabla `LoginEvent` está vacía.
- Historial demo (`ANA_HISTORY`, `TOMAS_HISTORY`): sesiones con correcciones, ejercicios resueltos y `DailyUsage`, creado por `seedUserHistory` sólo si el usuario no tiene sesiones. El XP del usuario se calcula a partir de ese historial (con los mismos valores que `XP_RULES`) y los resúmenes salen de los errores de cada sesión (`buildSummary`).
- La racha (`streakDays`) y `lastActiveDate` se fijan en el `upsert` del usuario y tienen que coincidir con los días seguidos de sesiones del historial (Tomás 10, Ana 5, última actividad ayer).
- Fechas relativas (`daysAgo(n)`) para que el historial demo siempre parezca reciente.

Al modificarlo:

- Todo dato nuevo se crea con `upsert` por una clave única o detrás de un chequeo de existencia. Nada de `create` suelto.
- Los `upsert` usan `update: {}`: **cambiar el texto de un escenario en el seed no actualiza bases existentes**. Para verlo, `docker compose down -v` (borra datos) o una migración/script de datos explícito.
- Si agregás un escenario, sumá su `slug` a `VOICE_BY_SCENARIO` en `src/services/speech.service.ts` (si no, usa la voz por defecto).
- `Scenario.systemPrompt` es sólo el contexto del personaje, en español; las reglas generales del tutor van en `src/prompts/tutor.prompt.ts`. `openingLine` va en inglés y adaptada al nivel del escenario.
- Las categorías de las correcciones y ejercicios demo usan el tipo local `Category`, copia de `ERROR_CATEGORIES`: si agregás una categoría, sumala ahí también.
- El seed se compila con `tsconfig.seed.json` en el build; corré `npm run build` si cambiás imports.

## Gotchas

- **Rutas SQLite relativas**: Prisma las resuelve desde la carpeta de `schema.prisma`, no desde donde corrés el comando. Con `DATABASE_URL="file:./data/dev.db"` la base queda en `backend/prisma/data/dev.db` (ignorada por `*.db`).

- Archivos `*.db`, `*.db-journal`, `backend/data/` y `prisma/dev.db*` están en `.gitignore`. Nunca commitees una base.
- Vitest apunta `DATABASE_URL` a `file:./test.db`, pero los tests actuales no tocan la base.
- En Alpine, Prisma necesita `openssl` (ya está en el `Dockerfile`). Si cambiás la imagen base, mantenelo.
