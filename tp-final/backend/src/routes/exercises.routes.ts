import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { answerExerciseSchema } from '../schemas/exercise.schema';
import { generateExercises, evaluateAnswer } from '../services/exercise.service';
import { xpForExercise } from '../services/gamification.service';
import { getExampleErrorsForCategories, getTopWeakCategories } from '../lib/weakness';

export const exercisesRouter = Router();

exercisesRouter.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const userLevel = req.user!.level;

    const weakCategories = await getTopWeakCategories(userId, 3);
    const exampleErrors = await getExampleErrorsForCategories(userId, weakCategories);

    const generated = await generateExercises(weakCategories, exampleErrors, userLevel);

    const created = await prisma.$transaction(
      generated.map((ex) =>
        prisma.exercise.create({
          data: {
            userId,
            category: ex.category,
            type: ex.type,
            prompt: ex.prompt,
            expectedAnswer: ex.expectedAnswer,
          },
        })
      )
    );

    const exercises = created.map((row, i) => ({
      id: row.id,
      category: row.category,
      type: row.type,
      prompt: row.prompt,
      sentence: generated[i].sentence,
    }));

    res.status(201).json({ exercises });
  })
);

exercisesRouter.post(
  '/:id/answer',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { answer } = answerExerciseSchema.parse(req.body);

    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!exercise || exercise.userId !== userId) {
      throw AppError.notFound('Ejercicio no encontrado');
    }
    if (exercise.isCorrect !== null) {
      throw AppError.badRequest('Este ejercicio ya fue respondido', 'ALREADY_ANSWERED');
    }

    const evaluation = await evaluateAnswer(exercise.prompt, exercise.expectedAnswer, answer);
    const xpEarned = xpForExercise(evaluation.isCorrect);

    const [updatedExercise] = await prisma.$transaction([
      prisma.exercise.update({
        where: { id: exercise.id },
        data: {
          userAnswer: answer,
          isCorrect: evaluation.isCorrect,
          feedback: evaluation.feedback,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpEarned } },
      }),
    ]);

    res.json({ exercise: updatedExercise, xpEarned });
  })
);
