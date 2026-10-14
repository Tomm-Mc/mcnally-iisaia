---
name: charla
description: Charla — tutor de inglés conversacional con IA para hispanohablantes. Monorepo con frontend React, backend Express y SQLite, orquestado con Docker Compose.
scope: proyecto
parent: ../CLAUDE.md
children:
  - backend/CLAUDE.md
  - backend/src/prompts/CLAUDE.md
  - backend/prisma/CLAUDE.md
  - frontend/CLAUDE.md
stack:
  frontend: React 18, Vite 5, TypeScript 5, Tailwind 3, TanStack Query 5, React Router 6, Recharts
  backend: Node 20, Express 4, TypeScript 5 (CommonJS), Prisma 5, Zod 3, SDK openai 4, Vitest 2
  database: SQLite (volumen Docker `charla-data`)
  infra: Docker Compose, nginx (estáticos + reverse proxy con SSE)
language: es-AR
last_reviewed: 2026-10-14
---

# Charla — Proyecto (TP Final IISAIA)

Charla hace practicar inglés **conversando** con personajes de IA (mozo, entrevistadora, recepcionista…) en escenarios por nivel CEFR (A2/B1/B2). Cada mensaje del usuario se corrige en paralelo sin romper el rol del personaje, los errores alimentan un perfil de debilidades por categoría, y a partir de ahí se generan ejercicios personalizados. Hay gamificación (XP + racha diaria) y un **modo voz** (speech-to-text + text-to-speech) para charlar hablando.

La fuente de verdad para usuarios del producto es [README.md](README.md). Este archivo es la guía para trabajar sobre el código.

## Estructura

```
tp-final/
├── docker-compose.yml   # servicios backend + frontend, volumen charla-data
├── .env.example         # plantilla de variables (copiar a .env)
├── .claude/skills/test-feature/  # checklist de verificación: usalo antes de dar algo por terminado
├── backend/             # API Express en /api/*  → ver backend/CLAUDE.md
│   ├── prisma/          # schema, migraciones, seed → ver backend/prisma/CLAUDE.md
│   └── src/prompts/     # prompts de IA → ver backend/src/prompts/CLAUDE.md
└── frontend/            # SPA React servida por nginx → ver frontend/CLAUDE.md
```

## Arquitectura en una línea por pieza

- **nginx (servicio `frontend`, puertos 5173→80 y 5443→443)** sirve el build de React (en 443 con un certificado autofirmado que se genera en `frontend/Dockerfile`, para que el micrófono funcione desde otros dispositivos de la red) y hace proxy de `/api/*` a `backend:4000` con `proxy_buffering off` para que el streaming SSE llegue token por token.
- **Backend (puerto 4000, sólo red interna de Docker)**: Express + Prisma. Toda la lógica de negocio y todas las llamadas a OpenAI (chat, STT y TTS) viven acá. El frontend **nunca** habla con OpenAI: en modo voz sólo graba audio con `MediaRecorder` y reproduce lo que devuelve el backend.
- **nginx** acepta bodies de hasta 10 MB en `/api/` (`client_max_body_size 10m`) para los audios; el backend tiene el mismo límite en `express.raw`. Si cambiás uno, cambiá el otro.
- **SQLite** en `/app/data/charla.db` dentro del volumen `charla-data`. Al arrancar, el contenedor corre `prisma migrate deploy` + seed idempotente.
- **IA con dos modos**: `mock` (heurísticas y plantillas, sin costo, default) y `real` (OpenAI). Ver "Modo mock".

## Comandos

Todos desde `tp-final/` salvo indicación.

> **Verificación: siempre en Docker.** No se instala nada ni se corre `npm` con el Node de la máquina del usuario (lo pidió explícitamente). Typecheck, tests y build se corren en contenedores `node:20-alpine` descartables, y después se borran los `node_modules` del host. Los comandos exactos, el smoke test con Compose y la verificación visual con Playwright están en la skill **`test-feature`** (`.claude/skills/test-feature/SKILL.md`): usala antes de reportar cualquier cambio como terminado. La tabla de abajo describe los scripts; no es una invitación a correrlos en el host.

| Tarea | Comando |
|---|---|
| Levantar todo | `cp .env.example .env` y `docker compose up --build` → http://localhost:5173 |
| Rebuild sólo backend | `docker compose up --build backend` |
| Reset total de datos | `docker compose down -v` (borra el volumen `charla-data`) |
| Logs del backend | `docker compose logs -f backend` |
| Backend en local | `cd backend && npm install && npx prisma migrate deploy && npm run seed && npm run dev`, con `JWT_SECRET` y `DATABASE_URL` exportadas antes (la app no lee `.env`; ver `backend/CLAUDE.md`) |
| Frontend en local | `cd frontend && npm install && npm run dev` (Vite proxea `/api` a `localhost:4000`) |
| Tests backend | `cd backend && npm test` |
| Typecheck | `cd backend && npm run typecheck` · `cd frontend && npm run typecheck` |

**Definición de "terminado"** para cualquier cambio: typecheck pasa en los paquetes tocados y `npm test` pasa en backend (los dos en Docker), los cambios de UI se miraron en un navegador real, la demo quedó limpia (`docker compose down -v` si las pruebas ensuciaron datos) y, si cambió un contrato de API o un flujo de usuario, el `README.md` está actualizado. Detalle en la skill `test-feature`.

## Variables de entorno (`.env` en `tp-final/`)

| Variable | Default | Notas |
|---|---|---|
| `OPENAI_API_KEY` | vacío | Si está vacía, el backend fuerza modo mock aunque `AI_MOCK_MODE=false`. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Debe soportar Structured Outputs (`response_format: json_schema`). |
| `OPENAI_STT_MODEL` | `gpt-4o-mini-transcribe` | Speech-to-text del modo voz. |
| `OPENAI_TTS_MODEL` | `gpt-4o-mini-tts` | Text-to-speech del modo voz. `instructions` sólo se manda a modelos `gpt-*`. |
| `AI_MOCK_MODE` | `true` | Sólo el string literal `"true"` activa el mock. |
| `JWT_SECRET` | — | Obligatoria, mínimo 8 caracteres; si falta, el backend hace `process.exit(1)`. |
| `DAILY_MESSAGE_LIMIT` | `60` | Mensajes de chat por usuario por día. |
| `DATABASE_URL` | `file:./data/dev.db` | En Docker la fija `docker-compose.yml` (`file:/app/data/charla.db`). |
| `PORT` | `4000` | |

Las variables se validan con Zod en `backend/src/config/env.ts`. Si agregás una, sumala ahí, en `.env.example` y en la tabla del README.

## Modo mock

`isMockMode = AI_MOCK_MODE === 'true' || !OPENAI_API_KEY`. En mock:

- el **corrector** aplica reglas regex sobre errores típicos de hispanohablantes ("I have 25 years", "arrive to", "childs"…);
- el **tutor** devuelve frases canned troceadas palabra por palabra con 35 ms de delay (simula streaming);
- **ejercicios, evaluación y resumen** salen de plantillas;
- el **STT** devuelve frases canned con errores típicos y el **TTS** responde `204`, así el frontend usa la voz del navegador.

**Toda funcionalidad de IA nueva tiene que tener su rama mock** que devuelva datos con la misma forma que el modo real. El proyecto se demuestra y se testea sin API key; no rompas eso. Por defecto, trabajá y verificá en modo mock; no hagas llamadas reales a OpenAI salvo que el usuario lo pida.

## Contratos que cruzan front ↔ back

Estos contratos están **duplicados a mano** entre los dos paquetes (no hay paquete de tipos compartido). Si cambiás uno, cambiá todos los lugares en el mismo cambio:

| Contrato | Backend | Frontend |
|---|---|---|
| Categorías de error | `src/schemas/enums.ts` (`ERROR_CATEGORIES`) + `enum` en `corrector.schema.ts` y `exercise.schema.ts` | `src/api/types.ts` (`ErrorCategory`) |
| Etiquetas en español | `CATEGORY_LABELS_ES` en `enums.ts` | `CATEGORY_LABELS_ES` en `api/types.ts` |
| Niveles, quality, tipos de ejercicio | `enums.ts` | `api/types.ts` |
| Forma de las respuestas | handlers en `src/routes/*.routes.ts` | interfaces en `src/api/types.ts` y `src/api/*.ts` |
| Eventos SSE del chat | `writeSseEvent` en `sessions.routes.ts` | `dispatchEvent` en `src/api/sessions.ts` |
| Modo de entrada del mensaje | `inputMode` en `session.schema.ts` | `InputMode` en `api/types.ts`, parámetro de `streamMessage` |
| Endpoints de voz | `routes/speech.routes.ts` | `src/api/speech.ts` |
| Roles | `ROLES` en `enums.ts`, `role` en el JWT y en `toPublicUser` | `Role` en `api/types.ts`, `HOME_BY_ROLE` en `ProtectedRoute.tsx` |
| Panel de admin | `routes/admin.routes.ts` + `lib/adminStats.ts` | `src/api/admin.ts` + tipos `Admin*` en `api/types.ts` (`DailyActivity` existe en los dos lados) |
| Envelope de error | `{ error: { code, message } }` (`errorHandler.ts`) | `ApiErrorBody` / `ApiError` |

### Protocolo SSE de `POST /api/sessions/:id/messages`

Orden garantizado: `correction` (1 vez) → `token` (N veces) → `done` (1 vez). Ante una falla después de abrir el stream: `error` y cierre. Los errores de validación, auth, rate limit o sesión inexistente ocurren **antes** de abrir el stream y vuelven como JSON normal con su status HTTP. El frontend consume el stream con `fetch` + `ReadableStream` (no `EventSource`, porque necesita POST y header `Authorization`).

## Convenciones transversales

- **Español rioplatense** en todo texto visible para el usuario, mensajes de error de la API, comentarios y logs. Identificadores en inglés.
- Estilo de código (no hay ESLint ni Prettier configurados, respetá el existente): 2 espacios, comillas simples, punto y coma, trailing commas en multilínea, líneas de hasta ~120 caracteres.
- TypeScript `strict` en ambos paquetes, con `noUnusedLocals` y `noUnusedParameters`. Prefijá con `_` los parámetros que no se usan. Nada de `any`; usá `unknown` + validación Zod.
- Comentarios sólo para el *por qué* (decisiones, limitaciones de una librería), en español, como los existentes.
- No agregues dependencias sin justificarlo; el stack es deliberadamente chico.

## Decisiones de diseño (no revertir sin discutirlo)

1. **Tutor y corrector son dos llamadas de IA separadas**: el personaje nunca corrige (rompería la inmersión); el corrector usa `temperature: 0` y Structured Outputs.
2. **Structured Outputs + Zod** para toda respuesta JSON de la IA, con fallback seguro si falla.
3. **SQLite** con campos "enum" modelados como `String` (Prisma + SQLite no soporta `enum`).
4. **SSE en vez de WebSockets**: el flujo es unidireccional.
5. **Login real con registro básico**: bcrypt + JWT. `POST /auth/register` crea **siempre** un `student` (el rol no se acepta del body; los admins sólo salen del seed), normaliza el email a minúsculas (también en login) y no devuelve token: el usuario inicia sesión después. Sin verificación de email ni recupero de contraseña. Tiene protección anti fuerza bruta **en memoria** (`lib/loginAttempts.ts`: 5 fallos por email en 15 min → `429 LOGIN_RATE_LIMIT`), a propósito sin tabla en la base: hay una sola instancia de backend y se resetea con un reinicio.
6. **Modo voz por el backend**: el audio viaja crudo en el body (sin multipart, sin dependencias nuevas), la transcripción entra al flujo normal de `/messages` con `inputMode: 'voice'` y el TTS se pide por oración a medida que llega el streaming. En mock, el TTS responde `204` y el navegador habla con Web Speech API.
7. **Roles `student` / `admin`**: el admin sólo ve el panel de solo lectura (`/admin`) y **no puede practicar** (las rutas de práctica le responden `403 WRONG_ROLE`), así sus pruebas no ensucian las estadísticas. El estudiante no ve el panel. Los permisos se aplican al montar los routers en `app.ts`, no ruta por ruta.

## Usuarios demo

`ana@charla.dev` / `charla123` (B1, racha 5, 8 sesiones + 10 ejercicios) · `tomas@charla.dev` / `charla123` (A2, racha 10, 10 sesiones + 10 ejercicios). Ambos con historial precargado por el seed (`ANA_HISTORY` / `TOMAS_HISTORY` en `backend/prisma/seed.ts`). `admin@charla.dev` / `charlaadmin`: administrador, entra al panel. Las tres credenciales están en el README y en los botones de `LoginPage.tsx`; si cambiás una, cambiá los tres lugares.

Si probás logins fallidos y quedás bloqueado (5 intentos), reiniciá el backend para limpiar el contador en memoria.

## Gotchas del proyecto

- **Finales de línea**: `backend/entrypoint.sh`, los `Dockerfile` y `nginx.conf` se usan dentro de contenedores Linux y tienen que quedar con LF. El autor trabaja en Windows con `core.autocrlf=true`; el `.gitattributes` de la raíz del repo los fuerza a `eol=lf`. No lo saques. Para verificar: `git ls-files --eol backend/entrypoint.sh`.
- **Fechas en UTC**: la racha (`updateStreak`), el rate limit diario y el timeline usan `toISOString().slice(0, 10)`, o sea días UTC. En Argentina (UTC-3) el "día" cambia a las 21:00 hora local. Es conocido; no lo "arregles" sólo en un lugar.
- **El nivel y el rol viajan en el JWT**: `req.user.level` y `req.user.role` salen del token (7 días de validez). Si cambian en la base, se reflejan recién al volver a loguearse. Los tokens viejos sin `role` se tratan como `student`.
- **`LoginEvent` crece sin límite**: cada intento de login suma una fila y no hay limpieza automática. Para un TP alcanza; en producción haría falta una política de retención (también por ser datos personales: IP y user agent).
- **Costo del modo voz**: `DAILY_MESSAGE_LIMIT` sólo limita `POST /sessions/:id/messages`. `/transcriptions` y `/speech` no tienen límite propio (cada uno es una llamada paga a OpenAI en modo real); el gasto queda acotado indirectamente porque cada transcripción termina en un mensaje. Si agregás otra ruta de IA, pensá su límite.
- **Micrófono y contexto seguro**: `getUserMedia` sólo funciona en `https` o `http://localhost`. Desde otro dispositivo de la red hay que entrar por `https://<IP>:5443` (certificado autofirmado: el navegador pide aceptarlo una vez). Si se entra por HTTP, el botón de micrófono explica el motivo y muestra esa URL.
- **Puerto HTTPS `5443` en tres lugares**: el puerto publicado en `docker-compose.yml`, la redirección `error_page 497` de `nginx.conf` y el aviso de `useVoiceMode.ts`. Si lo cambiás, cambialo en los tres.
- **Cambios en `.env`** requieren reiniciar el backend (`docker compose up --build backend`); el env se lee una sola vez al importar `config/env.ts`.
