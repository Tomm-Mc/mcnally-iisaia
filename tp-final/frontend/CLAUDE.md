---
name: charla-frontend
description: SPA de Charla. React 18 + Vite 5 + TypeScript + Tailwind 3 + TanStack Query 5 + React Router 6 + Recharts, con modo voz (MediaRecorder + Web Audio + Web Speech API), servida por nginx con proxy /api al backend.
scope: frontend
parent: ../CLAUDE.md
applies_to: "tp-final/frontend/**"
runtime: navegador (build estático en nginx:alpine)
entrypoint: src/main.tsx
port: 5173
commands:
  dev: npm run dev
  build: npm run build
  typecheck: npm run typecheck
  preview: npm run preview
ui_language: es-AR (voseo)
last_reviewed: 2026-10-14
---

# Charla — Frontend

SPA que consume `/api/*`. No tiene lógica de negocio ni de IA: muestra lo que devuelve el backend. Leé primero [../CLAUDE.md](../CLAUDE.md) para los contratos compartidos.

## Comandos (desde `tp-final/frontend/`)

```bash
npm run dev        # Vite en http://localhost:5173, proxy /api → http://localhost:4000 (backend levantado aparte)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + vite build → dist/
```

No hay tests ni linter configurados en el frontend. Como mínimo, `npm run typecheck` tiene que pasar. Para validar un cambio de UI, levantá la app (Docker o `npm run dev` + backend) y probá el flujo en el navegador con los usuarios demo.

## Estructura

```
src/
├── main.tsx            # providers: QueryClient → BrowserRouter → AuthProvider → App
├── App.tsx             # tabla de rutas; las privadas se envuelven en <Protected role=...> (ProtectedRoute + AppLayout)
├── api/
│   ├── client.ts       # apiFetch, ApiError, token en localStorage, manejo de 401
│   ├── types.ts        # tipos espejo del backend + CATEGORY_LABELS_ES
│   └── <recurso>.ts    # una función por endpoint
├── context/AuthContext.tsx  # user, isLoading, login, logout, refreshUser
├── hooks/useVoiceMode.ts    # loop del modo voz: escuchar → transcribir → enviar → hablar → escuchar
├── lib/                # microphone.ts (grabación + fin de turno por silencio), speechPlayer.ts (cola de TTS por oración)
├── pages/<Nombre>Page.tsx   # una por ruta; acá viven useQuery/useMutation
├── pages/admin/        # panel del administrador: AdminDashboardPage, AdminUsersPage, AdminUserDetailPage, AdminLoginsPage
└── components/
    ├── ui/             # primitivos: Button, Card, Badge, Spinner, EmptyState
    ├── layout/         # AppLayout (sidebar desktop + bottom nav mobile), ProtectedRoute
    ├── chat/           # ChatWindow, ChatInput, MessageBubble, CorrectionCard, VoicePanel
    ├── exercises/      # ExerciseCard
    ├── progress/       # gráficos Recharts del estudiante
    └── admin/          # Panel, StatCard, gráficos (MessagesByDayChart, DailyLineChart, RankingBarChart, LoginsChart),
                        #   chartTheme.ts (paleta validada), format.ts (fechas, %, user agent)
```

## Acceso a datos

- **Toda** llamada HTTP pasa por `apiFetch<T>(path, options)` en `api/client.ts`: agrega el prefijo `/api`, `Content-Type`, el header `Authorization: Bearer`, convierte errores al envelope `{ error: { code, message } }` en `ApiError`, y ante `401` limpia el token y desloguea. No uses `fetch` directo (las únicas excepciones son `streamMessage`, ver abajo, y `api/speech.ts`, que manda audio crudo y recibe un `Blob` en vez de JSON).
- Una función por endpoint en `api/<recurso>.ts`, con el tipo de respuesta explícito (`Promise<{ session: Session }>`). Los tipos van en `api/types.ts` y **deben reflejar exactamente** lo que devuelve el backend; si cambia un handler en `backend/src/routes/`, actualizalos.
- **TanStack Query** en las páginas: `useQuery` para lecturas y `useMutation` para escrituras. Query keys en uso (reutilizalas, no inventes variantes):

  | Key | Datos |
  |---|---|
  | `['session', sessionId]` | sesión con mensajes y correcciones |
  | `['sessions']` | historial |
  | `['scenarios', levelFilter]` | escenarios filtrados |
  | `['progress-summary']` | resumen de progreso |
  | `['progress-timeline']` | errores por día |
  | `['admin-overview']` | totales del panel |
  | `['admin-activity', days]` | serie diaria del panel (la comparten Resumen y Accesos) |
  | `['admin-users']` | tabla de usuarios |
  | `['admin-user-detail', userId, days]` | actividad de un usuario |
  | `['admin-logins', limit]` | últimos accesos |

  Config global en `main.tsx`: `retry: 1`, `refetchOnWindowFocus: false`. Si una mutación cambia datos que otra pantalla muestra en simultáneo, invalidá con `queryClient.invalidateQueries({ queryKey: [...] })`.
- **XP y racha** viven en `user` del `AuthContext`. Después de cualquier acción que pueda sumar XP (mensaje, ejercicio, terminar sesión), llamá `refreshUser()` para que el header se actualice.

## Chat y streaming (SSE)

`streamMessage` en `api/sessions.ts` consume el SSE con `fetch` + `ReadableStream` (EventSource no sirve: necesita POST y header de auth). Parsea bloques separados por `\n\n` y despacha por nombre de evento: `correction` → `token`* → `done`, o `error`.

`ChatWindow.tsx` maneja el ciclo:

1. Agrega un mensaje **optimista** con id `temp-N`.
2. `correction` → adjunta las correcciones al mensaje optimista y pasa a "streaming".
3. `token` → acumula en `streamingText` (burbuja del personaje escribiéndose).
4. `done` → reemplaza el optimista por los mensajes reales del servidor.
5. `error` → muestra el mensaje en la UI y resetea estados.

**Modo voz**: `useVoiceMode` se engancha en esos mismos callbacks (`onAssistantToken`, `onAssistantDone`, `onAssistantError`). Si el modo está prendido, cada oración completa del streaming se encola en el `SpeechPlayer` (TTS en paralelo, reproducción en orden) y al terminar de hablar se vuelve a abrir el micrófono. Los mensajes dictados se envían con `inputMode: 'voice'`.

### Modo voz: piezas y reglas

| Pieza | Responsabilidad |
|---|---|
| `lib/microphone.ts` (`MicrophoneSession`) | Abre el micrófono **una vez** por modo voz, graba con `MediaRecorder` (webm/opus, o mp4 en Safari) y corta el turno por silencio (~1,3 s, con 300 ms iniciales para calibrar el ruido ambiente). `isSupported()` indica si se puede grabar (si no, `enable` muestra por qué). |
| `lib/speechPlayer.ts` | `SentenceChunker` arma oraciones a partir de los tokens; `SpeechPlayer` pide el TTS de cada una en paralelo y las reproduce en orden. Si el backend devuelve `204` o falla, habla con `speechSynthesis` (en-US). |
| `hooks/useVoiceMode.ts` | Máquina de estados `idle → listening → transcribing → waiting → speaking` y el loop completo. Expone `enabled`, `replay`, `stopListening`, etc. |
| `components/chat/VoicePanel.tsx` | UI del modo voz (estado, nivel del micrófono, salir). Presentacional: no llama a la API. |
| `api/speech.ts` | `transcribeAudio` (audio crudo en el body → `{ text, mock }`; con `mock: true` la UI avisa que el texto es de ejemplo) y `synthesizeSpeech` (`Blob`, o `null` si `204`). |

Reglas:

- `lib/` contiene clases y utilidades **sin React** (APIs del navegador); `hooks/` las orquesta con estado de React; los componentes sólo renderizan. Mantené esa separación.
- **Liberá siempre los recursos**: al salir del modo voz o desmontar, `player.stop()` + `mic.close()` (tracks y `AudioContext`). El hook lo hace en `disable` y en el cleanup del `useEffect`; cualquier recurso nuevo se libera ahí también.
- Para cortar requests de TTS en vuelo se usa `AbortController` (el `SpeechPlayer` lo renueva en cada `stop()`).
- Detección de silencio con `setInterval`, no `requestAnimationFrame` (rAF se pausa con la pestaña en segundo plano).
- El botón de micrófono se muestra siempre que la sesión esté activa, aunque el navegador no pueda grabar: al tocarlo, `enable` explica el motivo (sin HTTPS → indica la URL `https://<host>:5443`). El de "escuchar" (`onSpeak`) aparece en los mensajes del personaje.
- No hay tests automáticos para esto: si tocás grabación o reproducción, probalo a mano en Chrome **y** en Safari o Firefox, y también en modo mock (voz del navegador).

Ojo: la lista de mensajes usa **el índice como `key` a propósito** (comentado en el código) para no desmontar la burbuja cuando el id temporal cambia al real. Los mensajes sólo se agregan, nunca se reordenan. No lo "corrijas" a `message.id`.

## UI y estilos

- **Tailwind** con tokens de marca en `tailwind.config.js`: `brand-primary` (violeta), `brand-secondary` (teal), `brand-accent` (ámbar), `brand-error`, `brand-errorBg`, `brand-bg`, `brand-text`. Usá esos tokens antes que colores sueltos; para fondos suaves se usan las escalas de Tailwind equivalentes (`violet-100`, `teal-100`, `amber-100`, `slate-*`).
- Tipografía Plus Jakarta Sans (Google Fonts en `index.html`). Bordes `rounded-2xl` en cards, botones y burbujas; `rounded-full` en pills.
- Reutilizá los primitivos de `components/ui/` (`Button` con `variant`/`size`, `Card`, `Badge` con `tone`, `Spinner`, `EmptyState`) antes de escribir markup nuevo. Si un patrón se repite en 2+ lugares, extraelo a `ui/`.
- Clases condicionales con template literals (no hay `clsx`); mantené el patrón de mapas `VARIANT_CLASSES`/`TONE_CLASSES` para variantes.
- Íconos de `lucide-react`, siempre con `aria-hidden="true"` cuando son decorativos y `h-4 w-4`/`h-5 w-5`.
- **Mobile-first**: el layout tiene sidebar en `md:` y bottom nav fija en mobile (por eso `main` tiene `pb-24`). Probá cualquier pantalla nueva en ancho de celular.
- Estados obligatorios en cada pantalla con datos: cargando (`Spinner`), vacío (`EmptyState` con emoji, título y acción), error (mensaje en `text-brand-error`, con `role="alert"` si aparece tras una acción del usuario).
- **Accesibilidad**: botones sólo-ícono con `aria-label`; emojis decorativos con `aria-hidden`; foco visible (`focus-visible:ring-*`, ya incluido en `Button`).

## Convenciones

- Componentes como **named exports** en función (`export function ChatPage()`); sólo `App.tsx` usa `export default`.
- Un componente por archivo, nombre de archivo = nombre del componente (`PascalCase.tsx`). Páginas terminan en `Page`.
- Props tipadas con `interface XxxProps` en el mismo archivo; `import type` para tipos.
- **Todo texto visible en español rioplatense** con voseo y tono cercano ("¡Hola, Ana! 👋", "Intentá de nuevo", "Volvé mañana"). El único texto en inglés es el de la conversación con el personaje y el contenido de los ejercicios.
- Labels de categorías: siempre `CATEGORY_LABELS_ES[category]`, nunca el valor crudo (`verb_tense`) en la UI.
- **Roles**: cada ruta privada declara su rol con `<Protected role="student" | "admin">` (default `student`). `ProtectedRoute` redirige al inicio del rol (`HOME_BY_ROLE`: `/` o `/admin`) si no coincide, y el login redirige ahí mismo. El backend también lo exige (`403 WRONG_ROLE`): esto es UX, no seguridad.
- Rutas nuevas: agregarlas en `App.tsx` con el rol que corresponda, y en `STUDENT_NAV_ITEMS` o `ADMIN_NAV_ITEMS` de `AppLayout.tsx` si van en la navegación (máximo ~5 ítems por el bottom nav mobile). Las rutas raíz de cada rol van en `EXACT_ROUTES` para que `NavLink` no las marque activas en subrutas.
- **Dos layouts, un mismo estilo**: `AppLayout` (estudiante) y `AdminLayout` (admin) comparten el lenguaje visual: barra lateral `slate-900` fija (`md:sticky`), fondo `brand-bg` (= `slate-100`), acentos ámbar en la navegación, tarjetas `rounded-xl` con borde `slate-200` y sin sombra. Lo que cambia es el contenido: el admin tiene la etiqueta "ADMIN", el aviso de sólo lectura y la pill "Administrador"; el estudiante, su navegación y las pills de racha y XP. `Protected` elige el layout según el `role` de la ruta. Si cambiás el estilo de uno, cambiá el otro.
- **Gráficos del panel**: colores sólo desde `chartTheme.ts` (`SERIES_COLORS`: violeta, teal-600, ámbar-600, validados juntos para daltonismo y contraste ≥ 3:1). Usalos en ese orden y no agregues un cuarto color sin revalidar. Conteos diarios con trazo `linear` (no `monotone`, que inventa valores entre días). Nunca dos ejes Y: dos métricas de distinta escala van en dos gráficos.
- `Card` es blanca con borde por defecto; si le pasás un fondo (`className="bg-brand-primary ..."`) no agrega `bg-white` ni el borde (antes se pisaban y la tarjeta "¿Lista para practicar?" quedaba blanca). Para hover usá borde/fondo (`hover:border-slate-300 hover:bg-slate-50`), no sombras.
- Sin estado global extra: server state en TanStack Query, sesión en `AuthContext`, el resto estado local. No agregues Redux/Zustand.

## Gotchas

- El token se guarda en `localStorage` con la clave `charla_token`. `AuthProvider` valida el token al montar con `/auth/me`; mientras tanto `isLoading` es `true` y `ProtectedRoute` muestra un spinner.
- `Session.summary` llega como **string JSON** desde `GET /sessions/:id`; `POST /sessions/:id/finish` en cambio devuelve `summary` ya parseado. Parseá cuando corresponda.
- El `Exercise.sentence` sólo existe en la respuesta de `/exercises/generate` (no se persiste); no lo esperes en otras respuestas.
- **Micrófono**: `getUserMedia` requiere contexto seguro (`https` o `http://localhost`). Si se entra por IP en la red local por HTTP, el micrófono no está disponible: por eso nginx también sirve HTTPS autofirmado en el puerto `5443` (certificado generado en el `Dockerfile`).
- **Autoplay**: los navegadores bloquean audio sin interacción previa. El modo voz arranca con un click del usuario (`handleStartVoice`); no dispares reproducción desde un efecto sin gesto previo.
- `api/speech.ts` no usa `apiFetch` (manda y recibe binario) pero replica su manejo de errores con `throwApiError`, incluido el `401`. Si cambia el manejo de errores de `client.ts`, revisalo ahí también.
- `StrictMode` está activo: en desarrollo los efectos corren dos veces. Los efectos con side effects (requests) deben ser idempotentes o pasar por React Query.
- En producción nginx sirve la SPA con `try_files ... /index.html`; las rutas de React Router funcionan con refresh. Si agregás un prefijo distinto de `/api` para el backend, hay que tocar `nginx.conf` **y** `vite.config.ts`.
