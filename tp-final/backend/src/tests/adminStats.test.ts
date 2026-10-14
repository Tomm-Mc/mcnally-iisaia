import { describe, expect, it } from 'vitest';
import { buildDailyActivity, lastNDays, percentage, startOfWindow } from '../lib/adminStats';

const NOW = new Date('2026-10-14T15:30:00.000Z');

describe('adminStats', () => {
  describe('lastNDays / startOfWindow', () => {
    it('devuelve los últimos N días en UTC, del más viejo a hoy', () => {
      expect(lastNDays(3, NOW)).toEqual(['2026-10-12', '2026-10-13', '2026-10-14']);
    });

    it('la ventana arranca a las 00:00 UTC del primer día', () => {
      expect(startOfWindow(7, NOW).toISOString()).toBe('2026-10-08T00:00:00.000Z');
    });
  });

  describe('percentage', () => {
    it('redondea a entero', () => {
      expect(percentage(1, 3)).toBe(33);
    });

    it('devuelve null si no hay base', () => {
      expect(percentage(0, 0)).toBeNull();
    });
  });

  describe('buildDailyActivity', () => {
    it('cuenta mensajes, voz, estudiantes únicos, sesiones y logins por día', () => {
      const activity = buildDailyActivity(
        {
          messages: [
            { createdAt: new Date('2026-10-14T10:00:00Z'), inputMode: 'text', userId: 'ana' },
            { createdAt: new Date('2026-10-14T11:00:00Z'), inputMode: 'voice', userId: 'ana' },
            { createdAt: new Date('2026-10-14T12:00:00Z'), inputMode: 'text', userId: 'tomas' },
            { createdAt: new Date('2026-10-13T12:00:00Z'), inputMode: 'text', userId: 'tomas' },
          ],
          sessions: [{ startedAt: new Date('2026-10-14T09:00:00Z') }],
          logins: [
            { createdAt: new Date('2026-10-14T08:00:00Z'), outcome: 'success' },
            { createdAt: new Date('2026-10-14T08:01:00Z'), outcome: 'invalid_credentials' },
            { createdAt: new Date('2026-10-14T08:02:00Z'), outcome: 'blocked' },
          ],
        },
        2,
        NOW
      );

      expect(activity).toEqual([
        { date: '2026-10-13', activeStudents: 1, messages: 1, voiceMessages: 0, sessionsStarted: 0, logins: 0, failedLogins: 0 },
        { date: '2026-10-14', activeStudents: 2, messages: 3, voiceMessages: 1, sessionsStarted: 1, logins: 1, failedLogins: 2 },
      ]);
    });

    it('ignora eventos fuera de la ventana', () => {
      const activity = buildDailyActivity(
        { messages: [{ createdAt: new Date('2026-09-01T10:00:00Z'), inputMode: 'text', userId: 'ana' }], sessions: [], logins: [] },
        7,
        NOW
      );
      expect(activity.every((d) => d.messages === 0)).toBe(true);
      expect(activity).toHaveLength(7);
    });
  });
});
