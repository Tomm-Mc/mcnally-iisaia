---
name: mcnally-iisaia
description: Repositorio de entregas del curso "Introducción a la ingeniería de software asistida por IA" (IISAIA). Contiene un TP por carpeta, cada uno independiente.
scope: repositorio
owner: Tomás Mc Nally (GitHub @Tomm-Mc)
language: es-AR
applies_to: "**"
children:
  - tp-final/CLAUDE.md
last_reviewed: 2026-10-14
---

# mcnally-iisaia — Repositorio del curso IISAIA

Repositorio académico con las entregas del curso. **Cada carpeta `tpN/` es un proyecto independiente**: no comparten dependencias, build ni configuración. Antes de trabajar en una entrega, leé su `README.md` y, si existe, su `CLAUDE.md`.

## Mapa del repo

| Carpeta | Contenido | Stack | Estado |
|---|---|---|---|
| `tp1/` | Formulario de contraseña con ruleta tragamonedas | HTML + CSS + JS vanilla en un único `index.html` | En proceso |
| `tp2/` | (Por definir, sólo README) | — | Pendiente |
| `tp-final/` | **Charla**: tutor de inglés conversacional con IA | React + Express + Prisma + OpenAI, Docker Compose | En desarrollo — ver [tp-final/CLAUDE.md](tp-final/CLAUDE.md) |

El `README.md` raíz tiene la tabla de estado de las entregas: si una tarea cambia el estado de un TP, actualizala.

## Reglas generales

- **Idioma**: toda la documentación, comentarios, mensajes de commit y texto de UI van en **español rioplatense** (voseo: "corregí", "intentá", "podés"). El código (identificadores, nombres de archivos) va en inglés.
- **No mezclar TPs**: un cambio pedido para un TP no toca archivos de otro. Si algo parece compartible, preguntá antes de extraerlo.
- **Trazabilidad de prompts**: es un curso sobre desarrollo asistido por IA. Cuando una entrega lo pida (como `tp1/prompts.md`), los prompts usados se registran tal cual, con una nota de qué salió bien y qué hubo que corregir. No reescribas ni "embellezcas" prompts ya registrados.
- **Los README de cada TP son parte de la entrega**: si cambiás comportamiento, endpoints, comandos o decisiones de diseño, actualizá el README correspondiente en el mismo cambio.
- **Secretos**: nunca commitear `.env` ni API keys. Sólo `.env.example` con valores de ejemplo.

## Entorno de desarrollo

- SO del autor: **Windows 10** (PowerShell / Git Bash). Los comandos de los README están en sintaxis POSIX; en PowerShell usá `Copy-Item` en vez de `cp`, etc.
- `core.autocrlf=true` en la máquina del autor. El `.gitattributes` de la raíz fuerza LF en `*.sh`, `Dockerfile` y `*.conf` (se usan en contenedores Linux). Si agregás otro tipo de archivo que corre dentro de un contenedor, sumalo ahí.

## Git

- Rama principal: `main`. Remoto: `https://github.com/Tomm-Mc/mcnally-iisaia`.
- Mensajes de commit en español, en modo imperativo o descriptivo corto (ej. `TP1`, `Actualización estado TP1`).
- Commitear sólo cuando el usuario lo pida.
