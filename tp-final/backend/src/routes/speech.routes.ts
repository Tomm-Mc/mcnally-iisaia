import express, { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { isMockMode } from '../lib/openai';
import { requireAuth } from '../middleware/auth';
import { synthesizeSpeechSchema } from '../schemas/speech.schema';
import { synthesizeCharacterSpeech, transcribeUserAudio } from '../services/speech.service';

export const speechRouter = Router();

// 10 MB alcanzan para varios minutos de audio Opus; el límite de OpenAI es 25 MB.
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

async function findOwnSession(sessionId: string, userId: string, { requireActive }: { requireActive: boolean }) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { scenario: true },
  });
  if (!session || session.userId !== userId) {
    throw AppError.notFound('Sesión no encontrada');
  }
  if (requireActive && session.status !== 'active') {
    throw AppError.badRequest('Esta sesión ya terminó', 'SESSION_FINISHED');
  }
  return session;
}

/**
 * Speech-to-text. El body es el audio crudo (ej. audio/webm de MediaRecorder),
 * así no hace falta una dependencia de multipart. Sólo transcribe: el texto
 * resultante se envía después por el flujo normal de POST /:id/messages.
 */
speechRouter.post(
  '/:id/transcriptions',
  requireAuth,
  express.raw({ type: ['audio/*', 'video/webm', 'application/octet-stream'], limit: MAX_AUDIO_BYTES }),
  asyncHandler(async (req, res) => {
    const session = await findOwnSession(req.params.id, req.user!.id, { requireActive: true });

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw AppError.badRequest('No llegó ningún audio. Probá grabar de nuevo.', 'EMPTY_AUDIO');
    }

    const lastAssistant = await prisma.message.findFirst({
      where: { sessionId: session.id, role: 'assistant' },
      orderBy: { createdAt: 'desc' },
    });

    const text = await transcribeUserAudio({
      audio: req.body,
      mimeType: req.headers['content-type'] ?? 'audio/webm',
      lastAssistantLine: lastAssistant?.content ?? null,
    });
    if (text === null) {
      throw new AppError(502, 'TRANSCRIPTION_FAILED', 'No pudimos transcribir tu audio. Probá decirlo de nuevo.');
    }

    // `mock: true` avisa al frontend que el texto es de ejemplo y no lo que dijo el usuario.
    res.json({ text, mock: isMockMode });
  })
);

/**
 * Text-to-speech con la voz del personaje de la sesión. Responde audio/mpeg,
 * o 204 en modo mock o si falló el TTS (el frontend usa la voz del navegador).
 */
speechRouter.post(
  '/:id/speech',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { text } = synthesizeSpeechSchema.parse(req.body);
    // No exige sesión activa: también se pueden re-escuchar mensajes de sesiones terminadas.
    const session = await findOwnSession(req.params.id, req.user!.id, { requireActive: false });

    const audio = await synthesizeCharacterSpeech({
      text,
      scenario: session.scenario,
      userLevel: req.user!.level,
    });

    if (!audio) {
      res.status(204).end();
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audio.length);
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  })
);
