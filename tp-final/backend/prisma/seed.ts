import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface ScenarioSeed {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  level: 'A2' | 'B1' | 'B2';
  characterName: string;
  characterRole: string;
  systemPrompt: string;
  openingLine: string;
}

const scenarios: ScenarioSeed[] = [
  {
    slug: 'restaurant',
    title: 'Pedir en un restaurante',
    description: 'Pedile la comida a un mozo en un restaurante de Nueva York.',
    emoji: '🍽️',
    level: 'A2',
    characterName: 'Jamie',
    characterRole: 'un mozo simpático y paciente en un restaurante casual',
    systemPrompt:
      'Trabajás como mozo/a en un restaurante casual. Recibís al cliente, le recomendás platos del menú, tomás su pedido y respondés preguntas sobre la carta.',
    openingLine: "Hi there! Welcome in. Can I start you off with something to drink?",
  },
  {
    slug: 'airport',
    title: 'Check-in en el aeropuerto',
    description: 'Hacé el check-in de tu vuelo y despachá tu equipaje.',
    emoji: '✈️',
    level: 'A2',
    characterName: 'Alex',
    characterRole: 'un agente de check-in de una aerolínea',
    systemPrompt:
      'Trabajás en el mostrador de check-in de una aerolínea. Pedís el pasaporte y la reserva, preguntás por el equipaje, y asignás un asiento.',
    openingLine: 'Good morning! Can I have your passport and booking reference, please?',
  },
  {
    slug: 'job-interview',
    title: 'Entrevista laboral',
    description: 'Respondé las preguntas de una entrevista para un puesto de oficina.',
    emoji: '💼',
    level: 'B1',
    characterName: 'Sarah',
    characterRole: 'una entrevistadora de recursos humanos',
    systemPrompt:
      'Sos entrevistadora de RRHH en una entrevista de trabajo para un puesto de analista. Hacés preguntas típicas de entrevista (experiencia, fortalezas, motivación) una por vez.',
    openingLine: "Thanks for coming in today! To start, can you tell me a little about yourself?",
  },
  {
    slug: 'hotel-checkin',
    title: 'Check-in en un hotel',
    description: 'Hacé el check-in en la recepción de un hotel.',
    emoji: '🏨',
    level: 'A2',
    characterName: 'Diego',
    characterRole: 'un recepcionista de hotel',
    systemPrompt:
      'Trabajás en la recepción de un hotel. Pedís el nombre de la reserva, el documento, ofrecés información del hotel y entregás la llave de la habitación.',
    openingLine: 'Good evening, welcome to the Grandview Hotel! Do you have a reservation with us?',
  },
  {
    slug: 'doctor-visit',
    title: 'Consulta médica',
    description: 'Contale a la doctora tus síntomas en una consulta.',
    emoji: '🩺',
    level: 'B1',
    characterName: 'Dr. Patel',
    characterRole: 'una médica clínica',
    systemPrompt:
      'Sos una médica clínica atendiendo a un paciente nuevo. Preguntás por los síntomas, hace cuánto los tiene, y dás recomendaciones simples.',
    openingLine: "Hello, please have a seat. What brings you in today?",
  },
  {
    slug: 'office-smalltalk',
    title: 'Small talk con un compañero de trabajo',
    description: 'Charlá informalmente con un compañero nuevo en la oficina.',
    emoji: '☕',
    level: 'B1',
    characterName: 'Mike',
    characterRole: 'un compañero de trabajo copado',
    systemPrompt:
      'Sos un compañero de trabajo charlando informalmente en la cocina de la oficina durante un café. Hablás de temas cotidianos: el fin de semana, hobbies, el clima.',
    openingLine: "Hey, I don't think we've met yet. I'm Mike, I just started in marketing. What's your name?",
  },
  {
    slug: 'product-return',
    title: 'Devolución de un producto',
    description: 'Devolvé un producto defectuoso en una tienda.',
    emoji: '🛍️',
    level: 'B1',
    characterName: 'Taylor',
    characterRole: 'un empleado de atención al cliente en una tienda',
    systemPrompt:
      'Trabajás en atención al cliente de una tienda de electrónica. El cliente quiere devolver o cambiar un producto; pedís el ticket, preguntás el motivo y proponés soluciones.',
    openingLine: 'Hi, how can I help you today?',
  },
  {
    slug: 'directions',
    title: 'Pedir indicaciones',
    description: 'Pedile indicaciones a un desconocido para llegar a un museo.',
    emoji: '🗺️',
    level: 'A2',
    characterName: 'Sam',
    characterRole: 'una persona local que conoce bien la ciudad',
    systemPrompt:
      'Sos un habitante local de la ciudad. Un turista te pide indicaciones para llegar a algún lugar. Le das direcciones claras paso a paso (calles, cuadras, referencias).',
    openingLine: "Hi! You look a bit lost, do you need help finding something?",
  },
];

async function seedUsers() {
  const passwordHash = await bcrypt.hash('charla123', 10);

  const ana = await prisma.user.upsert({
    where: { email: 'ana@charla.dev' },
    update: {},
    create: {
      email: 'ana@charla.dev',
      name: 'Ana',
      passwordHash,
      level: 'B1',
      xp: 45,
      streakDays: 3,
      lastActiveDate: daysAgo(1),
    },
  });

  const tomas = await prisma.user.upsert({
    where: { email: 'tomas@charla.dev' },
    update: {},
    create: {
      email: 'tomas@charla.dev',
      name: 'Tomás',
      passwordHash,
      level: 'A2',
      xp: 0,
      streakDays: 0,
      lastActiveDate: null,
    },
  });

  return { ana, tomas };
}

async function seedScenarios() {
  const created: Record<string, { id: string }> = {};
  for (const s of scenarios) {
    const scenario = await prisma.scenario.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
    created[s.slug] = scenario;
  }
  return created;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
}

interface TurnSeed {
  user: string;
  assistant: string;
  errors?: { original: string; corrected: string; category: string; explanation: string }[];
}

async function seedHistoricalSession(
  userId: string,
  scenarioId: string,
  daysBack: number,
  score: number,
  turns: TurnSeed[]
) {
  const startedAt = daysAgo(daysBack);
  const session = await prisma.session.create({
    data: {
      userId,
      scenarioId,
      status: 'finished',
      score,
      xpEarned: 20,
      startedAt,
      finishedAt: new Date(startedAt.getTime() + 1000 * 60 * 8),
      summary: JSON.stringify({
        score,
        strengths: ['Mantuviste la conversación fluida.', 'Usaste vocabulario apropiado para la situación.'],
        improvements: ['Prestá atención a los artículos antes de sustantivos.', 'Revisá los tiempos verbales en pasado.'],
        tip: 'Practicá contando anécdotas en pasado para afianzar los tiempos verbales.',
      }),
    },
  });

  let t = startedAt.getTime();
  for (const turn of turns) {
    t += 1000 * 60;
    const userMessage = await prisma.message.create({
      data: { sessionId: session.id, role: 'user', content: turn.user, createdAt: new Date(t) },
    });

    if (turn.errors && turn.errors.length > 0) {
      await prisma.correction.createMany({
        data: turn.errors.map((e) => ({
          messageId: userMessage.id,
          original: e.original,
          corrected: e.corrected,
          category: e.category,
          explanation: e.explanation,
          createdAt: new Date(t),
        })),
      });
    }

    t += 1000 * 30;
    await prisma.message.create({
      data: { sessionId: session.id, role: 'assistant', content: turn.assistant, createdAt: new Date(t) },
    });
  }

  return session;
}

async function seedAnaHistory(anaId: string, scenarioIds: Record<string, { id: string }>) {
  const existingCount = await prisma.session.count({ where: { userId: anaId } });
  if (existingCount > 0) {
    console.log('↪️  Ana ya tiene sesiones, se omite el historial de demo.');
    return;
  }

  await seedHistoricalSession(anaId, scenarioIds['restaurant'].id, 7, 72, [
    {
      user: 'I want a pizza and a coke, please.',
      assistant: "Great choice! Would you like a small, medium, or large pizza?",
    },
    {
      user: 'I have 25 years and I want the large pizza.',
      assistant: "Got it, one large pizza coming up! Anything else for you?",
      errors: [
        {
          original: 'I have 25 years',
          corrected: 'I am 25 years old',
          category: 'vocabulary',
          explanation: 'En inglés la edad se expresa con "to be", no con "to have".',
        },
      ],
    },
    {
      user: 'No thanks, is waiter coming soon with the food?',
      assistant: "It'll be right out, about ten minutes!",
      errors: [
        {
          original: 'is waiter coming',
          corrected: 'is the waiter coming',
          category: 'articles',
          explanation: 'Falta el artículo "the" antes de "waiter" porque es un sustantivo específico.',
        },
      ],
    },
  ]);

  await seedHistoricalSession(anaId, scenarioIds['job-interview'].id, 4, 80, [
    {
      user: 'I working as a marketing assistant for two years.',
      assistant: "That's great experience! What did you enjoy most about that role?",
      errors: [
        {
          original: 'I working',
          corrected: 'I have been working',
          category: 'verb_tense',
          explanation: 'Para una acción que empezó en el pasado y continúa, se usa el presente perfecto continuo.',
        },
      ],
    },
    {
      user: 'I like to organize events and I have good comunication skills.',
      assistant: 'Communication is key in this role. Can you give me an example?',
      errors: [
        {
          original: 'comunication',
          corrected: 'communication',
          category: 'spelling',
          explanation: '"Communication" se escribe con doble "m".',
        },
      ],
    },
    {
      user: 'Sure, last year I organize a conference for 200 peoples.',
      assistant: "That sounds like a big responsibility! How did it go?",
      errors: [
        {
          original: 'I organize',
          corrected: 'I organized',
          category: 'verb_tense',
          explanation: 'Con "last year" hay que usar el pasado simple.',
        },
        {
          original: 'peoples',
          corrected: 'people',
          category: 'plurals',
          explanation: '"People" ya es plural, no lleva "-s".',
        },
      ],
    },
  ]);

  await seedHistoricalSession(anaId, scenarioIds['hotel-checkin'].id, 1, 88, [
    {
      user: 'Good evening, I have a reservation under Ana Martinez.',
      assistant: 'Let me check... yes, I found it! Could I see your ID, please?',
    },
    {
      user: 'Here you are. Can I arrive to the pool after 10pm?',
      assistant: 'The pool closes at 10pm, but the gym is open 24 hours!',
      errors: [
        {
          original: 'arrive to the pool',
          corrected: 'get to the pool',
          category: 'prepositions',
          explanation: 'Con lugares como "the pool" se usa "get to", no "arrive to".',
        },
      ],
    },
  ]);

  console.log('✅ Historial de demo de Ana creado (3 sesiones).');
}

async function main() {
  console.log('🌱 Sembrando base de datos...');
  const { ana } = await seedUsers();
  const scenarioIds = await seedScenarios();
  await seedAnaHistory(ana.id, scenarioIds);
  console.log('✅ Seed completo.');
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
