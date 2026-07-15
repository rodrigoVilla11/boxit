export const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  QUADS: 'Cuádriceps',
  HAMSTRINGS: 'Isquios',
  GLUTES: 'Glúteos',
  CALVES: 'Gemelos',
  CORE: 'Core',
  FOREARMS: 'Antebrazos',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  BARBELL: 'Barra',
  DUMBBELL: 'Mancuernas',
  MACHINE: 'Máquina',
  CABLE: 'Polea',
  BODYWEIGHT: 'Peso corporal',
  KETTLEBELL: 'Kettlebell',
};

export const muscleLabel = (m: string): string => MUSCLE_LABELS[m] ?? m;
export const equipmentLabel = (e: string): string => EQUIPMENT_LABELS[e] ?? e;

export const MUSCLE_KEYS = Object.keys(MUSCLE_LABELS);
export const EQUIPMENT_KEYS = Object.keys(EQUIPMENT_LABELS);
