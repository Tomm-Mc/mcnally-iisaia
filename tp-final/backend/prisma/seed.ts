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
      xp: 0, // lo calcula seedUserHistory a partir del historial demo
      // 5 días seguidos de práctica (del día 5 al día 1 hacia atrás, ver ANA_HISTORY).
      streakDays: 5,
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
      xp: 0, // lo calcula seedUserHistory a partir del historial demo
      // 10 días seguidos de práctica (del día 10 al día 1 hacia atrás, ver TOMAS_HISTORY).
      streakDays: 10,
      lastActiveDate: daysAgo(1),
    },
  });

  // Cuenta del dueño de la app: sólo ve el panel de administración, no practica.
  // `level` es obligatorio en el schema pero no se usa para el admin.
  const adminPasswordHash = await bcrypt.hash('charlaadmin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@charla.dev' },
    update: {},
    create: {
      email: 'admin@charla.dev',
      name: 'Admin',
      passwordHash: adminPasswordHash,
      level: 'B2',
      role: 'admin',
    },
  });

  return { ana, tomas, admin };
}

async function seedScenarios() {
  const created: Record<string, { id: string; openingLine: string }> = {};
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

// ---------------------------------------------------------------------------
// Historial demo: simula varios días de uso para que el dashboard, el progreso,
// los resúmenes y los ejercicios muestren sugerencias reales desde el primer
// login. Todas las fechas son relativas a hoy (daysAgo) para que siempre
// parezca reciente.
// ---------------------------------------------------------------------------

// Copia local de ERROR_CATEGORIES (el seed no importa de src/): así el
// compilador avisa si una corrección demo usa una categoría inválida.
type Category =
  | 'verb_tense'
  | 'prepositions'
  | 'articles'
  | 'word_order'
  | 'vocabulary'
  | 'spelling'
  | 'plurals'
  | 'pronouns'
  | 'other';

// Mismos valores que XP_RULES en src/services/gamification.service.ts.
const XP = { MESSAGE_EXCELLENT: 10, MESSAGE_GOOD: 5, EXERCISE_CORRECT: 15, SESSION_COMPLETE: 20 };

interface ErrorSeed {
  original: string;
  corrected: string;
  category: Category;
  explanation: string;
}

interface TurnSeed {
  user: string;
  assistant: string;
  errors?: ErrorSeed[];
}

interface SessionSeed {
  scenario: string; // slug
  daysBack: number;
  score: number;
  strengths: string[];
  turns: TurnSeed[];
}

interface ExerciseSeed {
  daysBack: number;
  category: Category;
  type: 'fill_blank' | 'fix_sentence' | 'translate';
  prompt: string;
  expectedAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  feedback: string;
}

interface UserHistory {
  sessions: SessionSeed[];
  exercises: ExerciseSeed[];
}

function err(original: string, corrected: string, category: Category, explanation: string): ErrorSeed {
  return { original, corrected, category, explanation };
}

const CATEGORY_LABELS: Record<Category, string> = {
  verb_tense: 'los tiempos verbales',
  prepositions: 'las preposiciones',
  articles: 'los artículos (a / an / the)',
  word_order: 'el orden de las palabras',
  vocabulary: 'el vocabulario',
  spelling: 'la ortografía',
  plurals: 'los plurales',
  pronouns: 'los pronombres',
  other: 'detalles generales',
};

const CATEGORY_TIPS: Record<Category, string> = {
  verb_tense: 'Contá en voz alta qué hiciste ayer usando sólo pasado simple: "I went", "I ate", "I saw".',
  prepositions: 'Aprendé los verbos con su preposición como un bloque: "arrive at", "depend on", "look for".',
  articles: 'Antes de un sustantivo contable en singular casi siempre va "a", "an" o "the".',
  word_order: 'En inglés el orden es casi siempre sujeto + verbo + objeto; el adjetivo va antes del sustantivo.',
  vocabulary: 'Anotá las expresiones que no sabías y reutilizalas en la próxima charla.',
  spelling: 'Releé tu mensaje antes de enviarlo, prestando atención a las letras dobles.',
  plurals: 'Repasá los plurales irregulares más comunes: people, children, men, women.',
  pronouns: 'Fijate que el pronombre coincida con la persona: he/she para personas, it para cosas.',
  other: 'Seguí practicando con escenarios distintos para ganar soltura.',
};

/** Resumen de sesión derivado de los errores que tuvo esa sesión (misma forma que summary.schema). */
function buildSummary(session: SessionSeed) {
  const counts = new Map<Category, number>();
  for (const turn of session.turns) {
    for (const e of turn.errors ?? []) {
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
  }
  const byFrequency = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  const improvements =
    byFrequency.length > 0
      ? byFrequency.slice(0, 2).map((c) => `Prestá atención a ${CATEGORY_LABELS[c]}.`)
      : ['Animate a usar oraciones más largas y conectores como "because" o "although".'];
  const tip =
    byFrequency.length > 0
      ? CATEGORY_TIPS[byFrequency[0]]
      : '¡Sesión sin errores! Probá un escenario de un nivel más alto para seguir desafiándote.';

  return { score: session.score, strengths: session.strengths, improvements, tip };
}

/** XP de un mensaje según la cantidad de errores (equivale a la quality del corrector). */
function xpForTurn(turn: TurnSeed): number {
  const errors = turn.errors?.length ?? 0;
  if (errors === 0) return XP.MESSAGE_EXCELLENT;
  if (errors === 1) return XP.MESSAGE_GOOD;
  return 0;
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type ScenarioRef = { id: string; openingLine: string };

async function seedSession(userId: string, scenario: ScenarioRef, seed: SessionSeed) {
  const startedAt = daysAgo(seed.daysBack);
  const session = await prisma.session.create({
    data: {
      userId,
      scenarioId: scenario.id,
      status: 'finished',
      score: seed.score,
      xpEarned: XP.SESSION_COMPLETE,
      startedAt,
      finishedAt: new Date(startedAt.getTime() + 1000 * 60 * (2 + seed.turns.length * 2)),
      summary: JSON.stringify(buildSummary(seed)),
    },
  });

  // Igual que una sesión creada desde la app: arranca con la frase de apertura del personaje.
  await prisma.message.create({
    data: { sessionId: session.id, role: 'assistant', content: scenario.openingLine, createdAt: startedAt },
  });

  let t = startedAt.getTime();
  for (const turn of seed.turns) {
    t += 1000 * 60;
    const userMessage = await prisma.message.create({
      data: { sessionId: session.id, role: 'user', content: turn.user, createdAt: new Date(t) },
    });

    if (turn.errors && turn.errors.length > 0) {
      await prisma.correction.createMany({
        data: turn.errors.map((e) => ({ messageId: userMessage.id, ...e, createdAt: new Date(t) })),
      });
    }

    t += 1000 * 30;
    await prisma.message.create({
      data: { sessionId: session.id, role: 'assistant', content: turn.assistant, createdAt: new Date(t) },
    });
  }
}

/**
 * Crea sesiones, ejercicios resueltos y uso diario del usuario, y le asigna el
 * XP que corresponde a ese historial. Idempotente: si el usuario ya tiene
 * sesiones, no hace nada (no pisa el uso real de la app).
 */
async function seedUserHistory(
  user: { id: string; name: string },
  history: UserHistory,
  scenarioIds: Record<string, ScenarioRef>
) {
  const existingCount = await prisma.session.count({ where: { userId: user.id } });
  if (existingCount > 0) {
    console.log(`↪️  ${user.name} ya tiene sesiones, se omite el historial de demo.`);
    return;
  }

  let xp = 0;
  const messagesByDay = new Map<string, number>();

  for (const session of history.sessions) {
    await seedSession(user.id, scenarioIds[session.scenario], session);
    xp += XP.SESSION_COMPLETE + session.turns.reduce((sum, turn) => sum + xpForTurn(turn), 0);
    const day = utcDateKey(daysAgo(session.daysBack));
    messagesByDay.set(day, (messagesByDay.get(day) ?? 0) + session.turns.length);
  }

  for (const exercise of history.exercises) {
    const { daysBack, ...data } = exercise;
    await prisma.exercise.create({
      data: { userId: user.id, ...data, createdAt: new Date(daysAgo(daysBack).getTime() + 1000 * 60 * 30) },
    });
    if (exercise.isCorrect) xp += XP.EXERCISE_CORRECT;
  }

  for (const [date, messageCount] of messagesByDay) {
    await prisma.dailyUsage.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: {},
      create: { userId: user.id, date, messageCount },
    });
  }

  await prisma.user.update({ where: { id: user.id }, data: { xp } });

  console.log(
    `✅ Historial de demo de ${user.name}: ${history.sessions.length} sesiones, ${history.exercises.length} ejercicios, ${xp} XP.`
  );
}

// --- Tomás (A2): 10 días seguidos de práctica. Arranca con muchos errores y va
// mejorando; sus puntos débiles son preposiciones, tiempos verbales y artículos.
const TOMAS_HISTORY: UserHistory = {
  sessions: [
    {
      scenario: 'restaurant',
      daysBack: 10,
      score: 55,
      strengths: ['Te animaste a hacer tu primer pedido completo en inglés.', 'Usaste "please" y "thank you" con naturalidad.'],
      turns: [
        {
          user: 'Yes, I want a orange juice, please.',
          assistant: 'Sure! One orange juice. Are you ready to order some food?',
          errors: [err('a orange juice', 'an orange juice', 'articles', 'Antes de un sonido vocal se usa "an", no "a".')],
        },
        {
          user: 'Yesterday I eat here and the pasta was very good.',
          assistant: "Oh, welcome back! The pasta is really popular. Would you like it again?",
          errors: [err('Yesterday I eat', 'Yesterday I ate', 'verb_tense', 'Con "yesterday" hay que usar el pasado simple: "eat" → "ate".')],
        },
        {
          user: 'No, today I want try the hamburger with potatos.',
          assistant: 'Great choice! One burger with fries. How would you like it cooked?',
          errors: [
            err('I want try', 'I want to try', 'verb_tense', 'Después de "want" el verbo va con "to": "want to try".'),
            err('potatos', 'potatoes', 'plurals', 'El plural de "potato" es "potatoes", con "-es".'),
          ],
        },
      ],
    },
    {
      scenario: 'airport',
      daysBack: 9,
      score: 58,
      strengths: ['Respondiste todas las preguntas del agente.', 'Entendiste bien las instrucciones sobre el equipaje.'],
      turns: [
        {
          user: 'Here is my passport. I travel to Miami tomorrow.',
          assistant: 'Thank you. Are you checking any bags today?',
          errors: [err('I travel to Miami tomorrow', "I'm traveling to Miami tomorrow", 'verb_tense', 'Para planes futuros ya decididos se usa el presente continuo.')],
        },
        {
          user: 'Yes, I have two bags. Is possible a seat in the window?',
          assistant: 'Let me check... yes, I have a window seat in row 14.',
          errors: [
            err('Is possible', 'Is it possible', 'pronouns', 'En inglés el sujeto es obligatorio: "Is it possible...?".'),
            err('in the window', 'by the window', 'prepositions', 'Para un asiento junto a la ventana se dice "by the window" o "a window seat".'),
          ],
        },
        {
          user: 'Perfect. What time I must be in the gate?',
          assistant: 'Boarding starts at 9:15, so please be at gate 22 by 9.',
          errors: [
            err('What time I must be', 'What time must I be', 'word_order', 'En las preguntas el auxiliar va antes del sujeto.'),
            err('in the gate', 'at the gate', 'prepositions', 'Para un punto específico como una puerta de embarque se usa "at".'),
          ],
        },
      ],
    },
    {
      scenario: 'hotel-checkin',
      daysBack: 8,
      score: 62,
      strengths: ['Diste tus datos de reserva con claridad.', 'Hiciste preguntas útiles sobre el hotel.'],
      turns: [
        {
          user: 'Yes, I have reservation for three nights.',
          assistant: 'Perfect. Can I have your name, please?',
          errors: [err('I have reservation', 'I have a reservation', 'articles', 'Antes de un sustantivo contable en singular hace falta "a".')],
        },
        {
          user: 'My name is Tomás Mc Nally. I arrived to the city this morning.',
          assistant: 'Welcome, Mr. Mc Nally! I found your booking. Here is your key card.',
          errors: [err('arrived to the city', 'arrived in the city', 'prepositions', 'Con ciudades se usa "arrive in", nunca "arrive to".')],
        },
        {
          user: 'Thank you. The breakfast is included?',
          assistant: 'Yes, breakfast is included. It is served from 7 to 10 in the lobby restaurant.',
          errors: [err('The breakfast is included?', 'Is breakfast included?', 'word_order', 'En las preguntas con "to be" el verbo va antes del sujeto.')],
        },
      ],
    },
    {
      scenario: 'directions',
      daysBack: 7,
      score: 66,
      strengths: ['Pediste ayuda de forma educada.', 'Repetiste las indicaciones para confirmar que entendiste.'],
      turns: [
        {
          user: 'Yes, please. I am looking the museum of art.',
          assistant: "Oh, the Art Museum! It's not far. Go straight for two blocks.",
          errors: [err('looking the museum', 'looking for the museum', 'prepositions', 'Cuando buscás algo se dice "look for".')],
        },
        {
          user: 'Two blocks and then I turn in the left?',
          assistant: 'Exactly, turn left at the bank. The museum is on your right.',
          errors: [err('turn in the left', 'turn left', 'prepositions', 'Se dice simplemente "turn left" / "turn right", sin preposición.')],
        },
        {
          user: 'Thank you very much for your help!',
          assistant: "You're welcome! Enjoy the museum.",
        },
      ],
    },
    {
      scenario: 'restaurant',
      daysBack: 6,
      score: 70,
      strengths: ['Pediste para dos personas sin problemas.', 'Preguntaste por las recomendaciones del día.'],
      turns: [
        {
          user: 'Hi! A table for two people, please.',
          assistant: 'Of course, follow me. Here are your menus.',
        },
        {
          user: 'What do you recommend? Last week I order the soup and I loved it.',
          assistant: "Today's special is grilled salmon. It's delicious!",
          errors: [err('Last week I order', 'Last week I ordered', 'verb_tense', 'Con "last week" el verbo va en pasado simple: "ordered".')],
        },
        {
          user: 'OK, we want two salmons and a water, please.',
          assistant: 'Two salmon specials and a bottle of water. Coming right up!',
          errors: [err('a water', 'a bottle of water', 'articles', '"Water" es incontable: se dice "some water" o "a bottle of water".')],
        },
      ],
    },
    {
      scenario: 'airport',
      daysBack: 5,
      score: 74,
      strengths: ['Explicaste qué llevabas en el equipaje de mano.', 'Usaste bien las preguntas con "Can I...?".'],
      turns: [
        {
          user: 'Good morning. I am flying to Madrid today.',
          assistant: 'Good morning! May I see your passport, please?',
        },
        {
          user: 'Sure. Can I take my laptop in the cabin?',
          assistant: 'Yes, laptops are allowed in your carry-on bag.',
        },
        {
          user: 'Great. Last time I forget my charger in the plane.',
          assistant: "Oh no! Don't worry, I'm sure it won't happen again.",
          errors: [
            err('I forget', 'I forgot', 'verb_tense', 'Para algo que pasó la última vez, el pasado de "forget" es "forgot".'),
            err('in the plane', 'on the plane', 'prepositions', 'Con medios de transporte grandes (plane, bus, train) se usa "on".'),
          ],
        },
      ],
    },
    {
      scenario: 'hotel-checkin',
      daysBack: 4,
      score: 78,
      strengths: ['Hiciste un pedido especial con cortesía.', 'Tus preguntas fueron claras y bien formadas.'],
      turns: [
        {
          user: 'Good evening. I have a reservation under Mc Nally.',
          assistant: 'Good evening! Yes, I see it here. A double room for two nights.',
        },
        {
          user: 'Is it possible to have a room with view to the sea?',
          assistant: "Let me check... yes, I can give you a sea-view room on the 5th floor.",
          errors: [err('with view to the sea', 'with a sea view', 'articles', 'Falta el artículo: "a room with a view of the sea" o "a sea view".')],
        },
        {
          user: 'Wonderful, thank you so much!',
          assistant: 'My pleasure. Enjoy your stay!',
        },
      ],
    },
    {
      scenario: 'directions',
      daysBack: 3,
      score: 82,
      strengths: ['Entendiste indicaciones con varios pasos.', 'Pediste que te repitan algo de forma natural.'],
      turns: [
        {
          user: 'Excuse me, how can I get to the train station?',
          assistant: "Sure! Walk down this street and take the second right.",
        },
        {
          user: 'Sorry, can you repeat that more slowly, please?',
          assistant: 'Of course. Walk down this street... then take the second street on the right.',
        },
        {
          user: 'OK. Yesterday I go there by taxi, but today I want to walk.',
          assistant: "Good idea! It's only a ten-minute walk.",
          errors: [err('Yesterday I go', 'Yesterday I went', 'verb_tense', 'Con "yesterday" se usa el pasado simple: "go" → "went".')],
        },
      ],
    },
    {
      scenario: 'restaurant',
      daysBack: 2,
      score: 86,
      strengths: ['Pediste toda la comida sin errores importantes.', 'Usaste "I\'d like" en vez de "I want", que suena más amable.'],
      turns: [
        {
          user: "Hi! I'd like to see the menu, please.",
          assistant: "Here you go. Can I get you something to drink while you decide?",
        },
        {
          user: "Yes, I'd like an iced tea. And what are the specials today?",
          assistant: 'We have a mushroom risotto and a chicken curry.',
        },
        {
          user: "I'll have the risotto. Can I pay with card?",
          assistant: "Great choice! And yes, we accept all cards.",
          errors: [err('pay with card', 'pay by card', 'prepositions', 'Para medios de pago se usa "by card" o "with a card".')],
        },
      ],
    },
    {
      scenario: 'airport',
      daysBack: 1,
      score: 90,
      strengths: ['Hiciste el check-in completo de forma fluida.', 'Usaste bien el pasado y el futuro en la misma charla.'],
      turns: [
        {
          user: "Good morning! I'm flying to London. Here is my passport.",
          assistant: 'Thank you! Are you checking any bags?',
        },
        {
          user: 'Just one bag. I traveled with too many bags last time.',
          assistant: "Ha! Traveling light is always better. Here's your boarding pass.",
        },
        {
          user: 'Thanks! Where is a gate 12?',
          assistant: "Gate 12 is upstairs, to the left. Have a great flight!",
          errors: [err('a gate 12', 'gate 12', 'articles', 'Con nombres o números propios como "gate 12" no va artículo.')],
        },
      ],
    },
  ],
  exercises: [
    {
      daysBack: 6,
      category: 'verb_tense',
      type: 'fill_blank',
      prompt: 'Completá con el verbo en pasado: "Last night I ___ (watch) a movie."',
      expectedAnswer: 'watched',
      userAnswer: 'watch',
      isCorrect: false,
      feedback: 'Con "last night" hace falta el pasado simple: "watched".',
    },
    {
      daysBack: 6,
      category: 'verb_tense',
      type: 'fix_sentence',
      prompt: 'Corregí la oración: "Yesterday she go to the beach."',
      expectedAnswer: 'Yesterday she went to the beach.',
      userAnswer: 'Yesterday she goes to the beach.',
      isCorrect: false,
      feedback: 'Casi: "yesterday" pide pasado simple, y el pasado de "go" es "went".',
    },
    {
      daysBack: 6,
      category: 'articles',
      type: 'fill_blank',
      prompt: 'Completá con "a" o "an": "I would like ___ apple, please."',
      expectedAnswer: 'an',
      userAnswer: 'an',
      isCorrect: true,
      feedback: '¡Bien! "Apple" empieza con sonido vocal, por eso va "an".',
    },
    {
      daysBack: 6,
      category: 'articles',
      type: 'translate',
      prompt: 'Traducí al inglés: "Soy estudiante."',
      expectedAnswer: 'I am a student.',
      userAnswer: 'I am student.',
      isCorrect: false,
      feedback: 'Con profesiones hace falta el artículo: "I am a student".',
    },
    {
      daysBack: 6,
      category: 'prepositions',
      type: 'fill_blank',
      prompt: 'Completá con la preposición correcta: "We arrived ___ the airport at 6 pm."',
      expectedAnswer: 'at',
      userAnswer: 'at',
      isCorrect: true,
      feedback: '¡Perfecto! Para lugares puntuales como un aeropuerto se usa "arrive at".',
    },
    {
      daysBack: 2,
      category: 'verb_tense',
      type: 'fill_blank',
      prompt: 'Completá con el verbo en pasado: "Last week we ___ (go) to the mountains."',
      expectedAnswer: 'went',
      userAnswer: 'went',
      isCorrect: true,
      feedback: '¡Muy bien! "Go" es irregular y su pasado es "went".',
    },
    {
      daysBack: 2,
      category: 'verb_tense',
      type: 'fix_sentence',
      prompt: 'Corregí la oración: "I want try the soup."',
      expectedAnswer: 'I want to try the soup.',
      userAnswer: 'I want to try the soup.',
      isCorrect: true,
      feedback: '¡Exacto! Después de "want" va "to" + verbo.',
    },
    {
      daysBack: 2,
      category: 'articles',
      type: 'fill_blank',
      prompt: 'Completá con "a", "an" o "the": "Can I have ___ glass of water?"',
      expectedAnswer: 'a',
      userAnswer: 'a',
      isCorrect: true,
      feedback: '¡Bien! Es un vaso cualquiera, por eso "a".',
    },
    {
      daysBack: 2,
      category: 'prepositions',
      type: 'fill_blank',
      prompt: 'Completá con la preposición correcta: "I left my phone ___ the bus."',
      expectedAnswer: 'on',
      userAnswer: 'in',
      isCorrect: false,
      feedback: 'Con buses, trenes y aviones se usa "on": "on the bus".',
    },
    {
      daysBack: 2,
      category: 'prepositions',
      type: 'translate',
      prompt: 'Traducí al inglés: "Estoy buscando mi pasaporte."',
      expectedAnswer: "I'm looking for my passport.",
      userAnswer: 'I am looking for my passport.',
      isCorrect: true,
      feedback: '¡Perfecto! "Look for" es la forma correcta de decir "buscar".',
    },
  ],
};

// --- Ana (B1): practica hace un par de semanas y lleva 5 días seguidos. Sus
// puntos débiles son tiempos verbales, preposiciones y artículos.
const ANA_HISTORY: UserHistory = {
  sessions: [
    {
      scenario: 'restaurant',
      daysBack: 14,
      score: 68,
      strengths: ['Mantuviste la conversación fluida.', 'Usaste vocabulario apropiado para la situación.'],
      turns: [
        {
          user: 'I want a pizza and a coke, please.',
          assistant: 'Great choice! Would you like a small, medium, or large pizza?',
        },
        {
          user: 'I have 25 years and I want the large pizza.',
          assistant: 'Got it, one large pizza coming up! Anything else for you?',
          errors: [err('I have 25 years', 'I am 25 years old', 'vocabulary', 'En inglés la edad se expresa con "to be", no con "to have".')],
        },
        {
          user: 'No thanks, is waiter coming soon with the food?',
          assistant: "It'll be right out, about ten minutes!",
          errors: [err('is waiter coming', 'is the waiter coming', 'articles', 'Falta el artículo "the" antes de "waiter" porque es un sustantivo específico.')],
        },
      ],
    },
    {
      scenario: 'directions',
      daysBack: 11,
      score: 72,
      strengths: ['Hiciste preguntas claras para orientarte.', 'Agradeciste y cerraste la charla con naturalidad.'],
      turns: [
        {
          user: 'Yes! I am trying to find the Central Library since twenty minutes.',
          assistant: "Oh no! Don't worry, it's very close. Go straight and turn right at the corner.",
          errors: [err('I am trying ... since twenty minutes', "I've been trying ... for twenty minutes", 'verb_tense', 'Para algo que empezó antes y sigue, se usa presente perfecto continuo con "for".')],
        },
        {
          user: 'Is it in front to the park?',
          assistant: "Yes, exactly, it's right across from the park.",
          errors: [err('in front to the park', 'in front of the park', 'prepositions', 'La expresión correcta es "in front of".')],
        },
      ],
    },
    {
      scenario: 'restaurant',
      daysBack: 7,
      score: 75,
      strengths: ['Pediste algo fuera del menú con cortesía.', 'Usaste bien "Could I...?" para pedir.'],
      turns: [
        {
          user: 'Could I have the chicken without onions, please?',
          assistant: 'Of course! No onions. Anything to drink?',
        },
        {
          user: 'A lemonade. I came here the last month with my sister.',
          assistant: "Oh, that's nice! I hope you enjoyed it.",
          errors: [err('the last month', 'last month', 'articles', 'Con "last week / last month" no se usa "the".')],
        },
      ],
    },
    {
      scenario: 'office-smalltalk',
      daysBack: 5,
      score: 76,
      strengths: ['Te presentaste con naturalidad.', 'Hiciste preguntas para mantener viva la charla.'],
      turns: [
        {
          user: "Hi Mike, I'm Ana. I work here since March, in the finance team.",
          assistant: "Nice to meet you, Ana! Finance, huh? How do you like it so far?",
          errors: [err('I work here since March', "I've worked here since March", 'verb_tense', 'Con "since" se usa presente perfecto: "I\'ve worked".')],
        },
        {
          user: 'I like it a lot. On the weekend I usually go to run in the park.',
          assistant: 'That sounds great! I should start running too.',
          errors: [err('go to run', 'go running', 'verb_tense', 'Para actividades se usa "go" + verbo con -ing: "go running".')],
        },
        {
          user: 'You should! It is very good for relax after work.',
          assistant: "You're right, maybe I'll join you one day!",
          errors: [err('for relax', 'for relaxing', 'verb_tense', 'Después de una preposición el verbo va con -ing: "for relaxing".')],
        },
      ],
    },
    {
      scenario: 'job-interview',
      daysBack: 4,
      score: 80,
      strengths: ['Diste ejemplos concretos de tu experiencia.', 'Usaste vocabulario profesional adecuado.'],
      turns: [
        {
          user: 'I working as a marketing assistant for two years.',
          assistant: "That's great experience! What did you enjoy most about that role?",
          errors: [err('I working', 'I have been working', 'verb_tense', 'Para una acción que empezó en el pasado y continúa, se usa el presente perfecto continuo.')],
        },
        {
          user: 'I like to organize events and I have good comunication skills.',
          assistant: 'Communication is key in this role. Can you give me an example?',
          errors: [err('comunication', 'communication', 'spelling', '"Communication" se escribe con doble "m".')],
        },
        {
          user: 'Sure, last year I organize a conference for 200 peoples.',
          assistant: 'That sounds like a big responsibility! How did it go?',
          errors: [
            err('I organize', 'I organized', 'verb_tense', 'Con "last year" hay que usar el pasado simple.'),
            err('peoples', 'people', 'plurals', '"People" ya es plural, no lleva "-s".'),
          ],
        },
      ],
    },
    {
      scenario: 'doctor-visit',
      daysBack: 3,
      score: 82,
      strengths: ['Describiste tus síntomas con detalle.', 'Entendiste las recomendaciones de la doctora.'],
      turns: [
        {
          user: 'I have a headache since three days and I feel very tired.',
          assistant: "I'm sorry to hear that. Have you had any fever?",
          errors: [err('I have a headache since three days', "I've had a headache for three days", 'verb_tense', 'Presente perfecto + "for" para la duración de algo que sigue pasando.')],
        },
        {
          user: 'No fever, but I am sleeping bad because of the work.',
          assistant: "Stress can definitely cause headaches. Let's talk about your sleep routine.",
          errors: [err('sleeping bad', 'sleeping badly', 'word_order', 'Para modificar un verbo se usa el adverbio "badly", no el adjetivo "bad".')],
        },
        {
          user: 'OK. Should I take something for the pain?',
          assistant: 'You can take ibuprofen after meals, and try to rest more.',
        },
      ],
    },
    {
      scenario: 'product-return',
      daysBack: 2,
      score: 85,
      strengths: ['Explicaste el problema del producto con claridad.', 'Negociaste una solución con amabilidad.'],
      turns: [
        {
          user: 'Hi, I bought these headphones last week and they stopped working.',
          assistant: "I'm sorry about that. Do you have the receipt?",
        },
        {
          user: 'Yes, here it is. I would prefer a refund instead a replacement.',
          assistant: 'No problem, I can process a full refund for you.',
          errors: [err('instead a replacement', 'instead of a replacement', 'prepositions', '"Instead" va seguido de "of" antes de un sustantivo.')],
        },
        {
          user: 'Great, thank you for your help!',
          assistant: "You're welcome. Have a nice day!",
        },
      ],
    },
    {
      scenario: 'hotel-checkin',
      daysBack: 1,
      score: 88,
      strengths: ['Hiciste el check-in de forma muy fluida.', 'Pediste información sobre los servicios del hotel.'],
      turns: [
        {
          user: 'Good evening, I have a reservation under Ana Martinez.',
          assistant: 'Let me check... yes, I found it! Could I see your ID, please?',
        },
        {
          user: 'Here you are. Can I arrive to the pool after 10pm?',
          assistant: 'The pool closes at 10pm, but the gym is open 24 hours!',
          errors: [err('arrive to the pool', 'get to the pool', 'prepositions', 'Con lugares como "the pool" se usa "get to", no "arrive to".')],
        },
      ],
    },
  ],
  exercises: [
    {
      daysBack: 4,
      category: 'verb_tense',
      type: 'fill_blank',
      prompt: 'Completá con presente perfecto: "I ___ (live) in Buenos Aires since 2019."',
      expectedAnswer: 'have lived',
      userAnswer: 'live',
      isCorrect: false,
      feedback: 'Con "since" se usa presente perfecto: "I have lived".',
    },
    {
      daysBack: 4,
      category: 'verb_tense',
      type: 'fix_sentence',
      prompt: 'Corregí la oración: "Last summer we travel to Brazil."',
      expectedAnswer: 'Last summer we traveled to Brazil.',
      userAnswer: 'Last summer we traveled to Brazil.',
      isCorrect: true,
      feedback: '¡Bien! "Last summer" pide pasado simple.',
    },
    {
      daysBack: 4,
      category: 'prepositions',
      type: 'fill_blank',
      prompt: 'Completá con la preposición correcta: "It depends ___ the weather."',
      expectedAnswer: 'on',
      userAnswer: 'of',
      isCorrect: false,
      feedback: 'En inglés se dice "depend on", no "depend of" (calco del español).',
    },
    {
      daysBack: 4,
      category: 'prepositions',
      type: 'fill_blank',
      prompt: 'Completá con la preposición correcta: "The bank is in front ___ the school."',
      expectedAnswer: 'of',
      userAnswer: 'of',
      isCorrect: true,
      feedback: '¡Perfecto! "In front of" es la forma correcta.',
    },
    {
      daysBack: 4,
      category: 'articles',
      type: 'translate',
      prompt: 'Traducí al inglés: "La semana pasada fui al cine."',
      expectedAnswer: 'Last week I went to the cinema.',
      userAnswer: 'Last week I went to the cinema.',
      isCorrect: true,
      feedback: '¡Muy bien! Sin "the" antes de "last week".',
    },
    {
      daysBack: 1,
      category: 'verb_tense',
      type: 'fill_blank',
      prompt: 'Completá con presente perfecto continuo: "She ___ (study) English for two years."',
      expectedAnswer: 'has been studying',
      userAnswer: 'has been studying',
      isCorrect: true,
      feedback: '¡Excelente! Acción que empezó en el pasado y sigue: "has been studying".',
    },
    {
      daysBack: 1,
      category: 'verb_tense',
      type: 'fix_sentence',
      prompt: 'Corregí la oración: "I usually go to swim on Saturdays."',
      expectedAnswer: 'I usually go swimming on Saturdays.',
      userAnswer: 'I usually go swimming on Saturdays.',
      isCorrect: true,
      feedback: '¡Bien! Con actividades se usa "go" + -ing.',
    },
    {
      daysBack: 1,
      category: 'prepositions',
      type: 'fill_blank',
      prompt: 'Completá con la preposición correcta: "I prefer tea instead ___ coffee."',
      expectedAnswer: 'of',
      userAnswer: 'of',
      isCorrect: true,
      feedback: '¡Correcto! "Instead of" + sustantivo.',
    },
    {
      daysBack: 1,
      category: 'prepositions',
      type: 'translate',
      prompt: 'Traducí al inglés: "Llegamos a Londres el lunes."',
      expectedAnswer: 'We arrived in London on Monday.',
      userAnswer: 'We arrived to London on Monday.',
      isCorrect: false,
      feedback: 'Con ciudades se usa "arrive in": "We arrived in London".',
    },
    {
      daysBack: 1,
      category: 'articles',
      type: 'fill_blank',
      prompt: 'Completá con "a", "an", "the" o nada (-): "She is ___ engineer at a big company."',
      expectedAnswer: 'an',
      userAnswer: 'an',
      isCorrect: true,
      feedback: '¡Bien! Profesión + sonido vocal: "an engineer".',
    },
  ],
};

/**
 * Accesos de demo para el panel de administración: un login exitoso cada día
 * que el usuario practicó (5 minutos antes de la sesión) y algunos fallidos.
 * Idempotente: si ya hay accesos registrados, no hace nada.
 */
async function seedLoginHistory(users: { user: { id: string; email: string }; history: UserHistory }[]) {
  const existingCount = await prisma.loginEvent.count();
  if (existingCount > 0) {
    console.log('↪️  Ya hay accesos registrados, se omite el historial de logins de demo.');
    return;
  }

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0 (seed de demo)';
  const fiveMinutes = 1000 * 60 * 5;
  const events: { email: string; userId: string | null; outcome: string; createdAt: Date; userAgent: string }[] = [];

  for (const { user, history } of users) {
    const practiceDays = [...new Set(history.sessions.map((s) => s.daysBack))];
    for (const daysBack of practiceDays) {
      events.push({
        email: user.email,
        userId: user.id,
        outcome: 'success',
        createdAt: new Date(daysAgo(daysBack).getTime() - fiveMinutes),
        userAgent,
      });
    }
  }

  const [first] = users;
  if (first) {
    // Un error de tipeo del usuario y un intento con un email que no existe.
    events.push(
      {
        email: first.user.email,
        userId: first.user.id,
        outcome: 'invalid_credentials',
        createdAt: new Date(daysAgo(3).getTime() - 2 * fiveMinutes),
        userAgent,
      },
      { email: 'desconocido@ejemplo.com', userId: null, outcome: 'invalid_credentials', createdAt: daysAgo(2), userAgent }
    );
  }

  await prisma.loginEvent.createMany({ data: events });
  console.log(`✅ Historial de accesos de demo creado (${events.length} eventos).`);
}

async function main() {
  console.log('🌱 Sembrando base de datos...');
  const { ana, tomas } = await seedUsers();
  const scenarioIds = await seedScenarios();
  await seedUserHistory(ana, ANA_HISTORY, scenarioIds);
  await seedUserHistory(tomas, TOMAS_HISTORY, scenarioIds);
  await seedLoginHistory([
    { user: ana, history: ANA_HISTORY },
    { user: tomas, history: TOMAS_HISTORY },
  ]);
  console.log('✅ Seed completo.');
}

main()
  .catch((error) => {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
