---
name: test-feature
description: Checklist y comandos concretos para verificar un cambio en Charla (tp-final) antes de darlo por terminado — typecheck, tests de Vitest, y cuándo hace falta levantar Docker o mirar la UI en un browser real. Usar SIEMPRE antes de decir que una feature/fix/endpoint/componente "está listo", "funciona" o "terminado", y cada vez que el usuario pida "testealo", "probalo", "verificá que funcione" o "corré los tests". También aplica después de mergear o revisar cambios de otro agente trabajando en paralelo sobre este mismo repo, antes de seguir construyendo sobre ellos.
---

# Testear una feature de Charla

Este repo lo tocan varios agentes en paralelo (backend, frontend, voz, docs). "Compila" no es lo mismo que "funciona", y un cambio que no se verifica puede esconder una regresión que otro agente hereda sin darse cuenta. Esta skill es el mínimo que hay que correr antes de reportar algo como terminado — no reemplaza criterio, pero evita el error más común: dar por bueno un cambio que sólo se leyó, nunca se ejecutó.

## Regla de oro del entorno

**No instales dependencias ni corras `npm` directo en la máquina del usuario.** Ya se pidió explícitamente no hacerlo ("¿no corre todo en Docker? ¿qué querés testear en mi máquina?"). Todo (`npm install`, `tsc`, `vitest`) corre **dentro de un contenedor Docker descartable** que monta el repo, nunca con node/npm del host. Si hace falta generar algo que queda en disco (como `package-lock.json` o una migración de Prisma), es igual de válido — esos archivos son parte del repo — pero el `node_modules` que quede en el host después hay que borrarlo (`rm -rf node_modules`) para no ensuciar el working tree.

En Git Bash de Windows, los `docker run -v` con rutas tipo `/app` necesitan `MSYS_NO_PATHCONV=1` adelante, si no MSYS traduce `/app` a una ruta de Windows rota. Y las imágenes `node:20-alpine` necesitan `apk add --no-cache openssl` antes de usar Prisma (si no, el motor de Prisma tira un error de "Could not parse schema engine response" por falta de libssl).

## 1. Typecheck (siempre, es gratis y rápido)

```bash
# Backend
cd backend && MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd):/app" -w /app \
  node:20-alpine sh -c "apk add --no-cache openssl >/dev/null 2>&1 && npm install --no-audit --no-fund >/dev/null 2>&1 && npx prisma generate >/dev/null 2>&1 && npm run typecheck"

# Frontend
cd ../frontend && MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd):/app" -w /app \
  node:20-alpine sh -c "npm install --no-audit --no-fund >/dev/null 2>&1 && npm run typecheck"

# Limpieza (no dejar node_modules en el host)
cd .. && rm -rf backend/node_modules frontend/node_modules
```

Si el cambio es sólo en un paquete (ej. sólo frontend), igual corré el typecheck de ambos si tocaste algo compartido conceptualmente (un contrato de API, un tipo que existe duplicado a mano en los dos lados — ver "Contratos que cruzan front ↔ back" en `CLAUDE.md`).

## 2. Tests de Vitest (siempre que se tocó `backend/`)

```bash
cd backend && MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd):/app" -w /app \
  node:20-alpine sh -c "apk add --no-cache openssl >/dev/null 2>&1 && npm install --no-audit --no-fund >/dev/null 2>&1 && npx prisma generate >/dev/null 2>&1 && npm test"
cd .. && rm -rf backend/node_modules
```

- Un servicio de IA nuevo o modificado necesita su propio test mockeando `../lib/openai` (ver el patrón en `backend/src/tests/corrector.service.test.ts`): respuesta válida, respuesta que no valida contra el schema de Zod → fallback, y excepción → fallback. Si agregaste un servicio de IA y no tiene un test así, la verificación está incompleta.
- Lógica pura nueva (gamificación, rate limiting, lo que sea) va con tests que inyectan `now`/estado en vez de depender del reloj real, como `gamification.test.ts` o `loginAttempts.test.ts`.
- Los `stderr` con `❌` durante los tests son **esperados** en los casos que prueban el camino de fallback — no son fallas, son el `console.error` intencional del propio código. Lo que importa es el resumen final (`Test Files X passed`, `Tests Y passed`).

## 3. Smoke test con Docker Compose real (cuando el cambio cruza capas)

Hace falta esto — no alcanza con typecheck + unit tests — si el cambio toca: una ruta nueva montada en `app.ts`, el schema de Prisma (migración), `docker-compose.yml`, un `Dockerfile`, `nginx.conf`, o el flujo completo de un endpoint (login, SSE del chat, etc.).

```bash
docker compose up -d --build
# esperar a que backend esté healthy:
timeout 30 sh -c 'until curl -sf http://localhost:5173/api/health >/dev/null; do sleep 1; done'
```

Después, pegale al endpoint real con `curl` (login → token → usar el token en el endpoint que cambiaste). No asumas que porque el handler "se ve bien" va a funcionar: cosas como el orden de middlewares, un `JSON.stringify` que falta, o un `await` que se comió una promesa sólo aparecen corriendo el código de verdad.

Si el cambio metió datos de prueba en la base (sesiones, intentos de login bloqueados, etc.) y vas a terminar la verificación, dejá la demo limpia: `docker compose down -v && docker compose up -d` resetea todo al estado del seed. No se la dejes sucia a quien use la app después (otro agente, el usuario, un profesor en la defensa).

## 4. Verificación visual (sólo para cambios de UI/UX)

Un `tsc --noEmit` que pasa no dice nada sobre si un componente se ve bien, si un estado se pisa, o si hay un error en la consola del browser. Para cambios de frontend visibles (una página nueva, un componente que cambió, un flujo de interacción), levantá la app con Docker Compose y manejala con un browser headless de verdad — no te quedes sólo con la lectura del código.

El patrón que ya funcionó en este entorno (sin `chromium-cli` disponible): un contenedor `mcr.microsoft.com/playwright` que navega contra `http://host.docker.internal:5173` (el puerto publicado por `docker-compose.yml`), con `--add-host=host.docker.internal:host-gateway`. Sacá capturas en los puntos clave del flujo y revisalas con la herramienta de lectura de imágenes — "miré el código" no es lo mismo que "miré la pantalla". Revisá también `console --errors`: una página puede renderizar su layout mientras todos los fetches de datos fallan en silencio.

Si encontrás un bug real en este paso (pasó: un `key={message.id}` que cambiaba de id y resetear un estado de UI sin que nadie lo pidiera), arreglalo y volvé a correr el mismo flujo para confirmar que ahora sí persiste.

## 5. Antes de decir "listo"

- ¿Typecheck pasa en los paquetes que tocaste?
- ¿`npm test` pasa en backend, si lo tocaste?
- Si cambiaste un contrato de API o un flujo de usuario, ¿actualizaste `README.md` y/o el `CLAUDE.md` correspondiente? (Ver la sección "Contratos que cruzan front ↔ back" del `CLAUDE.md` raíz — están duplicados a mano entre frontend y backend, así que un cambio de forma en una respuesta rompe algo si no se replica.)
- ¿Quedó el repo limpio (sin `node_modules` en el host, sin datos de prueba sucios en el volumen de Docker si hiciste un smoke test)?

Si alguna de estas no se puede contestar que sí con algo concreto que corriste (no "debería andar"), todavía no está terminado.
