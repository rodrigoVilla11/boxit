import type { Exercise } from './api-client';
import { createRoutine, type Routine } from './routines';

/**
 * Catálogo estático de rutinas pre-armadas. Mapea a ejercicios GLOBALES por
 * nombre (los del seed); al elegir una, se resuelven los ids contra la librería
 * y se crea la rutina con el flujo normal. Los nombres deben existir en el seed.
 */
export type TemplateExercise = {
  name: string;
  targetSets: number;
  targetReps: number;
};

export type RoutineTemplate = {
  id: string;
  name: string;
  category: 'Push / Pull / Legs' | 'Full Body' | 'Upper / Lower';
  summary: string;
  exercises: TemplateExercise[];
};

const S = (name: string, targetSets: number, targetReps: number): TemplateExercise => ({
  name,
  targetSets,
  targetReps,
});

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'ppl-push',
    name: 'Empuje (Push)',
    category: 'Push / Pull / Legs',
    summary: 'Pecho, hombros y tríceps',
    exercises: [
      S('Press de banca', 4, 8),
      S('Press inclinado con mancuernas', 3, 10),
      S('Press militar', 3, 10),
      S('Elevaciones laterales', 3, 12),
      S('Extensión de tríceps en polea', 3, 12),
    ],
  },
  {
    id: 'ppl-pull',
    name: 'Tirón (Pull)',
    category: 'Push / Pull / Legs',
    summary: 'Espalda y bíceps',
    exercises: [
      S('Dominadas', 4, 8),
      S('Remo con barra', 4, 8),
      S('Jalón al pecho', 3, 10),
      S('Curl de bíceps con barra', 3, 10),
      S('Curl martillo', 3, 12),
    ],
  },
  {
    id: 'ppl-legs',
    name: 'Piernas (Legs)',
    category: 'Push / Pull / Legs',
    summary: 'Cuádriceps, femorales y glúteos',
    exercises: [
      S('Sentadilla', 4, 8),
      S('Peso muerto', 3, 6),
      S('Prensa de piernas', 3, 12),
      S('Curl femoral', 3, 12),
      S('Elevación de gemelos', 4, 15),
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body',
    category: 'Full Body',
    summary: 'Todo el cuerpo en una sesión',
    exercises: [
      S('Sentadilla', 3, 8),
      S('Press de banca', 3, 8),
      S('Remo con barra', 3, 8),
      S('Press militar', 3, 10),
      S('Plancha', 3, 1),
    ],
  },
  {
    id: 'upper',
    name: 'Tren superior (Upper)',
    category: 'Upper / Lower',
    summary: 'Pecho, espalda, hombros y brazos',
    exercises: [
      S('Press de banca', 4, 8),
      S('Remo con barra', 4, 8),
      S('Press militar', 3, 10),
      S('Curl de bíceps con barra', 3, 10),
      S('Extensión de tríceps en polea', 3, 12),
    ],
  },
  {
    id: 'lower',
    name: 'Tren inferior (Lower)',
    category: 'Upper / Lower',
    summary: 'Piernas y glúteos completos',
    exercises: [
      S('Sentadilla', 4, 8),
      S('Peso muerto', 3, 6),
      S('Hip thrust', 3, 10),
      S('Curl femoral', 3, 12),
      S('Elevación de gemelos', 4, 15),
    ],
  },
];

/**
 * Crea una rutina a partir de una plantilla, resolviendo los ejercicios por
 * nombre contra la librería. Ignora los que no encuentre (defensa). Devuelve la
 * rutina creada, o lanza si no se resolvió ningún ejercicio.
 */
export async function createFromTemplate(
  template: RoutineTemplate,
  library: Exercise[],
): Promise<Routine> {
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e.id]));
  const exercises = template.exercises
    .map((t) => {
      const exerciseId = byName.get(t.name.toLowerCase());
      return exerciseId
        ? { exerciseId, targetSets: t.targetSets, targetReps: t.targetReps }
        : null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
  if (exercises.length === 0) {
    throw new Error('No se pudo armar la plantilla con tu librería.');
  }
  return createRoutine(template.name, exercises);
}
