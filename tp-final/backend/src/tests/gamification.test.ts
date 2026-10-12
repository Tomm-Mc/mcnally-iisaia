import { describe, expect, it } from 'vitest';
import { updateStreak, xpForExercise, xpForMessage, xpForSessionComplete, XP_RULES } from '../services/gamification.service';

describe('gamification.service', () => {
  describe('xpForMessage', () => {
    it('da XP_RULES.MESSAGE_EXCELLENT para quality excellent', () => {
      expect(xpForMessage('excellent')).toBe(XP_RULES.MESSAGE_EXCELLENT);
    });

    it('da XP_RULES.MESSAGE_GOOD para quality good', () => {
      expect(xpForMessage('good')).toBe(XP_RULES.MESSAGE_GOOD);
    });

    it('no da XP para quality needs_work', () => {
      expect(xpForMessage('needs_work')).toBe(0);
    });
  });

  describe('xpForExercise', () => {
    it('da XP si la respuesta es correcta', () => {
      expect(xpForExercise(true)).toBe(XP_RULES.EXERCISE_CORRECT);
    });

    it('no da XP si la respuesta es incorrecta', () => {
      expect(xpForExercise(false)).toBe(0);
    });
  });

  describe('xpForSessionComplete', () => {
    it('siempre da XP_RULES.SESSION_COMPLETE', () => {
      expect(xpForSessionComplete()).toBe(XP_RULES.SESSION_COMPLETE);
    });
  });

  describe('updateStreak', () => {
    const now = new Date('2024-06-15T12:00:00.000Z');

    it('devuelve 1 si nunca hubo actividad previa', () => {
      expect(updateStreak(null, 0, now)).toBe(1);
    });

    it('mantiene la racha si ya hubo actividad hoy', () => {
      const today = new Date('2024-06-15T03:00:00.000Z');
      expect(updateStreak(today, 5, now)).toBe(5);
    });

    it('suma 1 si la última actividad fue ayer', () => {
      const yesterday = new Date('2024-06-14T23:00:00.000Z');
      expect(updateStreak(yesterday, 5, now)).toBe(6);
    });

    it('reinicia a 1 si la última actividad fue hace más de un día', () => {
      const lastWeek = new Date('2024-06-08T12:00:00.000Z');
      expect(updateStreak(lastWeek, 5, now)).toBe(1);
    });
  });
});
