---
name: charla-backend
description: API REST + SSE + audio de Charla. Express 4 + TypeScript (CommonJS) + Prisma/SQLite + Zod + SDK openai (chat, STT, TTS). Expone /api/* detrás de nginx.
scope: backend
parent: ../CLAUDE.md
children:
  - prisma/CLAUDE.md
  - src/prompts/CLAUDE.md
applies_to: "tp-final/backend/**"
runtime: Node 20 (node:20-alpine en Docker)
entrypoint: src/index.ts
port: 4000
commands:
  dev: npm run dev
  build: npm run build
  test: npm test
  typecheck: npm run typecheck
  seed: npm run seed
  migrate_dev: npx prisma migrate dev --name <nombre>
  migrate_deploy: npm run prisma:deploy
last_reviewed: 2026-10-14
---

# Charla — Backend

API en `/api/*`. Todo el negocio y toda la integración con OpenAI viven acá. Leé primero [../CLAUDE.md](../CLAUDE.md) para el contexto del proyecto y los contratos con el frontend.

## Comandos (desde `tp-final/backend/`)

```bash
npm run dev          # tsx watch, http://localhost:4000
npm test             # vitest run (env de test en vitest.config.ts, siempre modo mock)
npm run typecheck    # tsc --noEmit
npm run build        # compila src/ y prisma/seed.ts a dist/
npm run seed         # seed idempotente
npx prisma migrate dev --name <nombre>   # nueva migración (ver prisma/CLAUDE.md)
npx prisma studio    # inspeccionar la base
```

En local sin Docker: **la app no carga `.env` sola** (no hay `dotenv`). Un `backend/.env` sólo lo lee el CLI de Prisma (`migrate`, `studio`). Para `npm run dev` tenés que exportar al menos `JWT_SECRET` y `DATABASE_URL="file:./data/dev.db"` en la shell (PowerShell: `$env:JWT_SECRET="..."`). El `.env` de `tp-final/` sólo lo usa Docker Compose.

## Arquitectura por capas

```
src/
├── index.ts            # arranque: createApp() + listen + log del modo de IA
├── app.ts              # helmet, cors, json, montaje de routers, 404, errorHandler
├── config/env.ts       # validación Zod de process.env → `env`, `isMockMode`
├── routes/*.routes.ts  # HTTP: parseo/validación, auth, ownership, orquestación, persistencia
│                       #   speech.routes.ts: STT/TTS, montado también en /api/sessions
│                       #   admin.routes.ts: panel del dueño (sólo lectura), /api/admin
├── services/*.service.ts  # lógica de dominio e IA (tutor, corrector, ejercicios, resumen, gamificación)
├── prompts/*.prompt.ts # builders de prompts (funciones puras que devuelven string)
├── schemas/*.schema.ts # Zod de requests + Zod/JSON Schema de respuestas de IA; enums.ts
├── lib/                # prisma (singleton), openai (cliente + helpers chat/STT/TTS), errors, asyncHandler,
│                       #   weakness, loginAttempts (anti fuerza bruta en memoria)
├── middleware/         # requireAuth (JWT), requireRole, dailyMessageRateLimit, errorHandler
├── types/express.d.ts  # augment de Request con `user?: AuthUser`
└── tests/*.test.ts     # Vitest
```

Responsabilidades:

- **Routes** son las únicas que leen `req`/escriben `res` y las que hablan con Prisma para persistir. Mantenelas finas: validan, chequean pertenencia, llaman servicios, guardan, responden.
- **Services** no conocen Express. Los de IA reciben datos planos, deciden mock vs. real, y **nunca lanzan** por fallas de IA: devuelven un fallback. `gamification.service.ts` es puro (sin I/O) y es el lugar de las reglas de XP/racha.
- **`lib/weakness.ts`** concentra las consultas de "debilidades por categoría"; reutilizalo en vez de reescribir agregaciones sobre `Correction`.
- **`lib/openai.ts`** es el único lugar que instancia el SDK de OpenAI. Exponé helpers ahí (`createStructuredCompletion`, `streamChatCompletion`, `transcribeAudio`, `synthesizeSpeech`) en vez de llamar al SDK desde servicios.
- **`lib/loginAttempts.ts`** guarda los intentos de login fallidos en un `Map` en memoria (5 por email cada 15 min). Funciones puras con `now` inyectable, testeadas en `loginAttempts.test.ts`. Si el backend pasara a más de una instancia, hay que moverlo a un store compartido.

## Recetas

### Nuevo endpoint

1. Schema Zod del body/query en `src/schemas/<dominio>.schema.ts` (exportá también el `type` con `z.infer`).
2. Handler en el router correspondiente, siempre envuelto en `asyncHandler` (Express 4 no captura promesas rechazadas):

   ```ts
   router.post(
     '/:id/algo',
     requireAuth,
     asyncHandler(async (req, res) => {
       const userId = req.user!.id;
       const input = algoSchema.parse(req.body);           // ZodError → 400 VALIDATION_ERROR
       const entity = await prisma.x.findUnique({ where: { id: req.params.id } });
       if (!entity || entity.userId !== userId) {
         throw AppError.notFound('X no encontrado');       // 404 también si es de otro usuario
       }
       // ...
       res.json({ entity });
     })
   );
   ```
3. Si es un router nuevo, montalo en `app.ts` bajo `/api/<recurso>` **con su guardia de rol**: `...studentOnly` para rutas de práctica, `requireAuth, requireRole('admin')` para el panel. Un router sin guardia de rol deja entrar a cualquier usuario logueado.
4. Agregá el tipo de respuesta y la función cliente en el frontend (`src/api/`), y la fila en la tabla de endpoints del README.

### Nueva funcionalidad de IA

Ver [src/prompts/CLAUDE.md](src/prompts/CLAUDE.md). Resumen: prompt builder en `prompts/`, Zod + JSON Schema en `schemas/`, servicio con rama mock y fallback en `services/`, test con `lib/openai` mockeado.

## Convenciones

- **Errores**: lanzá `AppError` con sus factories (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `tooManyRequests`) y un `code` en `SCREAMING_SNAKE_CASE` cuando el frontend necesite distinguir el caso (`ALREADY_ANSWERED`, `SESSION_FINISHED`, `INVALID_CREDENTIALS`). El mensaje es para mostrarse al usuario: español rioplatense, amable y accionable.
- **Envelope de error** siempre `{ error: { code, message } }`. No respondas errores con otra forma.
- **Respuestas exitosas** envuelven el recurso con una clave nombrada (`{ session }`, `{ sessions }`, `{ exercise, xpEarned }`), nunca un array o primitivo pelado. Creaciones devuelven `201`.
- **Ownership**: todo recurso de usuario se busca y se compara `userId` contra `req.user!.id`; si no coincide, `404` (no revelar existencia con `403`).
- **Usuario autenticado**: `req.user!` es seguro sólo después de `requireAuth`. Contiene `{ id, email, level }` tomados del JWT.
- **Enums**: los campos tipo enum son `String` en la DB. Al leer, casteá a la unión de `schemas/enums.ts` (`row.level as Level`); al recibir input, validá con el `z.enum` correspondiente.
- **Transacciones**: si una operación escribe en más de una tabla y debe ser atómica (ej. responder ejercicio + sumar XP), usá `prisma.$transaction([...])`.
- **XP y racha**: no hardcodees números; usá `XP_RULES` y las funciones de `gamification.service.ts`. Para sumar XP y actualizar racha juntos, usá `bumpUserActivity` en `sessions.routes.ts` (si lo necesitás en otro router, movelo a un servicio en vez de duplicarlo).
- **Logs**: `console.error('❌ ...', err)` para errores, con emoji al inicio como el resto del código. Nunca loguees tokens, contraseñas ni la API key.
- **Imports**: relativos (`../lib/prisma`), `import type` para tipos. Sin path aliases.

## Autenticación

- `POST /auth/register` (`auth.routes.ts`): valida con `registerSchema` (nombre 2–60, contraseña 8–72 por el límite de bcrypt, `level` default `A2`), crea **siempre** `role: 'student'` (el rol nunca se toma del body) y responde `201 { user }` **sin token**: el frontend lleva al login con el email cargado.
- Email duplicado → `409 EMAIL_TAKEN`. Se chequea antes de crear, y además se atrapa el `P2002` de Prisma (`@unique`) para el caso de dos registros simultáneos. Si agregás otro campo único, manejá el `P2002` igual.
- El email se normaliza (trim + minúsculas) en el schema compartido de login y registro. No normalices a mano en las rutas.
- `POST /auth/login`: bloqueo en memoria (`loginAttempts`), registro en `LoginEvent` y token con `id`, `email`, `level` y `role`.
- El registro no tiene límite de intentos propio y `EMAIL_TAKEN` revela si un email existe. Es aceptable para el TP; si la app se expone, sumale un rate limit.

## Roles y panel de administración

- `User.role` es `student | admin` (`ROLES` en `enums.ts`). El rol viaja en el JWT; `requireAuth` lo pone en `req.user.role` (default `student` para tokens viejos).
- `requireRole(role)` (en `middleware/auth.ts`) va **después** de `requireAuth` y responde `403 WRONG_ROLE`. Se aplica al montar en `app.ts`: los routers de práctica con `studentOnly = [requireAuth, requireRole('student')]` y `/api/admin` con `requireRole('admin')`. Los routers de práctica siguen teniendo `requireAuth` por ruta (se verifica el token dos veces; es barato y deja cada ruta segura aunque se monte en otro lado).
- `/api/admin/*` es **sólo lectura**. Las consultas viven en `lib/adminStats.ts` (como `weakness.ts`): traen filas con Prisma y agregan en memoria, porque Prisma no agrupa por día y con SQLite a esta escala es más claro que SQL crudo. Las funciones puras (`buildDailyActivity`, `lastNDays`, `percentage`) están testeadas en `adminStats.test.ts`; si agregás una métrica, sumá la lógica pura ahí y su test.
- **Accesos**: `auth.routes.ts` registra cada intento en `LoginEvent` (`success`, `invalid_credentials`, `blocked`) con IP (`X-Real-IP` de nginx, o `req.ip`) y user agent. `recordLoginEvent` **nunca** corta el login: si la escritura falla, loguea y sigue.
- **Uso del modo voz**: `Message.inputMode` se guarda en cada mensaje del usuario (`text | voice`).
- Endpoints: `/overview`, `/activity?days=`, `/users`, `/users/:id/activity?days=` (reusa `buildDailyActivity` filtrado por usuario y `getErrorCountsByCategory` de `weakness.ts`), `/logins?limit=`.
- Las métricas usan días UTC, igual que la racha y el límite diario.

## Audio (modo voz)

`routes/speech.routes.ts` se monta en `/api/sessions` **antes** que `sessionsRouter` (comparten prefijo; las rutas no se pisan).

- `POST /:id/transcriptions`: el body es **audio crudo** (`express.raw` a nivel de ruta, tipos `audio/*`, `video/webm`, `application/octet-stream`, máx. 10 MB). No agregues `multer` ni multipart. Exige sesión activa. Devuelve `{ text, mock }` (`mock: true` = texto de ejemplo, el frontend lo avisa). Si el STT falla responde `502 TRANSCRIPTION_FAILED` para que el usuario repita.
- `POST /:id/speech`: body JSON `{ text }`. Devuelve `audio/mpeg` o `204` (modo mock o falla del TTS). No exige sesión activa (se pueden re-escuchar mensajes viejos).
- La transcripción **no** se guarda: el frontend la manda después por `POST /:id/messages` con `inputMode: 'voice'`, que es el que persiste, corrige y suma XP.
- `inputMode` (`text | voice`, default `text`) se define en `session.schema.ts` y viaja a `analyzeMessage` (corrector ignora ortografía/puntuación) y a `generateTutorReply` como `spoken` (respuestas aptas para TTS).
- El SDK infiere el formato del audio por la **extensión del nombre de archivo**, no por el MIME: usá `filenameForMimeType` del servicio.
- Validación de ownership compartida en `findOwnSession` dentro del router; reutilizala para nuevas rutas de audio.

## SSE (chat)

`POST /api/sessions/:id/messages` es el endpoint más delicado:

- Todas las validaciones (auth, rate limit, body, ownership, sesión activa) van **antes** de `res.flushHeaders()`, para que fallen como JSON con status correcto.
- Después de abrir el stream no se puede cambiar el status: los errores se reportan con `writeSseEvent(res, 'error', { message })` y `res.end()`, dentro del `try/catch` existente.
- Orden de eventos `correction` → `token`* → `done`. Si agregás un evento, sumalo al switch de `dispatchEvent` en `frontend/src/api/sessions.ts` y documentalo en `../CLAUDE.md`.
- Contexto enviado a la IA: últimos 6 mensajes para el corrector, últimos 20 para el tutor. Respetá esos recortes (costo de tokens).

## Tests

- Vitest, `environment: node`. `vitest.config.ts` inyecta `JWT_SECRET`, `AI_MOCK_MODE=true` y una `DATABASE_URL` de test; sin eso `config/env.ts` hace `process.exit(1)` al importarse.
- Tests existentes: `corrector.service.test.ts` y `speech.service.test.ts` (IA mockeada con `vi.mock('../lib/openai')`), `gamification.test.ts`, `loginAttempts.test.ts` y `adminStats.test.ts` (funciones puras, fechas inyectadas vía parámetro `now`), `requireRole.test.ts`, `schemas.test.ts` (incluye `registerSchema`).
- Se corren en Docker, no con el Node del host: ver la skill `test-feature` y la nota de verificación en `../CLAUDE.md`.
- Estado en memoria a nivel de módulo: `loginAttempts` se limpia en `beforeEach` con `resetLoginAttempts()`. Si agregás estado de módulo nuevo, exponé un reset equivalente para tests (el índice de `MOCK_TRANSCRIPTS` en `speech.service.ts` no lo tiene; no escribas tests que dependan de qué frase mock sale).
- Para testear la rama "real" de un servicio de IA, seguí el patrón de `corrector.service.test.ts`: mockeá `../lib/openai` exportando `isMockMode: false` y la función de completion como `vi.fn()`. Cubrí siempre: respuesta válida, respuesta que no valida contra Zod → fallback, y excepción → fallback.
- Los tests no tocan la base. Si un test necesita Prisma, preferí extraer la lógica a una función pura y testear eso.
- Nombres de `describe`/`it` en español.

## Gotchas

- `requireAuth` lanza de forma sincrónica (no es async), por eso funciona sin `asyncHandler`. Cualquier middleware async nuevo **sí** necesita `asyncHandler` (ver `rateLimit.ts`).
- `dailyMessageRateLimit` incrementa el contador **antes** de procesar el mensaje: un mensaje que falla igual cuenta. Sólo se aplica a `/messages`; `/transcriptions` y `/speech` no tienen límite propio.
- El bloqueo de login se chequea **antes** de buscar al usuario y cuenta también emails inexistentes; un login exitoso resetea el contador. Reiniciar el backend lo limpia (el contador vive en memoria; el historial de `LoginEvent` en la base no se borra).
- `express.json()` es global en `app.ts` pero sólo parsea `application/json`, por eso el audio crudo llega intacto a `express.raw`. No pongas un parser global que consuma otros content types.
- `Session.summary` se guarda como **JSON stringificado**; hay que hacer `JSON.parse` al leerlo (ver `/finish`).
- `Exercise` no persiste el campo `sentence` que genera la IA: se devuelve sólo en la respuesta de `/exercises/generate`, y `evaluateAnswer` recibe `exercise.prompt` como enunciado. Si tocás ejercicios, tenelo en cuenta (agregar la columna requiere migración).
- Las listas de categorías están repetidas en `enums.ts` y en los JSON Schemas de `corrector.schema.ts` y `exercise.schema.ts` (literal). Mantenelas sincronizadas.
- El build compila también `prisma/seed.ts` (vía `tsconfig.seed.json`) a `dist/prisma/seed.js`, que es lo que corre `entrypoint.sh` en producción. Si el seed importa algo de `src/`, verificá que compile con ambos tsconfig.
- `lib/prisma.ts` cachea el cliente en `global` fuera de producción para sobrevivir al hot reload de `tsx watch`; no instancies `PrismaClient` en otro lado (excepto el seed, que es un script aparte).
