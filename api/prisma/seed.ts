import { PrismaClient, Muscle, Equipment } from '@prisma/client';

const prisma = new PrismaClient();

type SeedExercise = {
  name: string;
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  equipment: Equipment;
};

// Librería semilla — ~20 ejercicios base (nombres en español rioplatense)
const exercises: SeedExercise[] = [
  // Pecho
  { name: 'Press de banca', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.TRICEPS, Muscle.SHOULDERS], equipment: Equipment.BARBELL },
  { name: 'Press inclinado con mancuernas', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.SHOULDERS, Muscle.TRICEPS], equipment: Equipment.DUMBBELL },
  { name: 'Aperturas en polea', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.SHOULDERS], equipment: Equipment.CABLE },
  { name: 'Fondos en paralelas', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.TRICEPS, Muscle.SHOULDERS], equipment: Equipment.BODYWEIGHT },
  // Espalda
  { name: 'Dominadas', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS, Muscle.FOREARMS], equipment: Equipment.BODYWEIGHT },
  { name: 'Remo con barra', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS, Muscle.FOREARMS], equipment: Equipment.BARBELL },
  { name: 'Jalón al pecho', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS], equipment: Equipment.CABLE },
  { name: 'Remo con mancuerna', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS, Muscle.FOREARMS], equipment: Equipment.DUMBBELL },
  // Hombros
  { name: 'Press militar', primaryMuscle: Muscle.SHOULDERS, secondaryMuscles: [Muscle.TRICEPS, Muscle.CORE], equipment: Equipment.BARBELL },
  { name: 'Elevaciones laterales', primaryMuscle: Muscle.SHOULDERS, secondaryMuscles: [], equipment: Equipment.DUMBBELL },
  // Bíceps
  { name: 'Curl de bíceps con barra', primaryMuscle: Muscle.BICEPS, secondaryMuscles: [Muscle.FOREARMS], equipment: Equipment.BARBELL },
  { name: 'Curl martillo', primaryMuscle: Muscle.BICEPS, secondaryMuscles: [Muscle.FOREARMS], equipment: Equipment.DUMBBELL },
  // Tríceps
  { name: 'Extensión de tríceps en polea', primaryMuscle: Muscle.TRICEPS, secondaryMuscles: [], equipment: Equipment.CABLE },
  { name: 'Press francés', primaryMuscle: Muscle.TRICEPS, secondaryMuscles: [], equipment: Equipment.BARBELL },
  // Piernas
  { name: 'Sentadilla', primaryMuscle: Muscle.QUADS, secondaryMuscles: [Muscle.GLUTES, Muscle.HAMSTRINGS, Muscle.CORE], equipment: Equipment.BARBELL },
  { name: 'Prensa de piernas', primaryMuscle: Muscle.QUADS, secondaryMuscles: [Muscle.GLUTES, Muscle.HAMSTRINGS], equipment: Equipment.MACHINE },
  { name: 'Peso muerto', primaryMuscle: Muscle.HAMSTRINGS, secondaryMuscles: [Muscle.GLUTES, Muscle.BACK, Muscle.FOREARMS], equipment: Equipment.BARBELL },
  { name: 'Curl femoral', primaryMuscle: Muscle.HAMSTRINGS, secondaryMuscles: [Muscle.GLUTES], equipment: Equipment.MACHINE },
  { name: 'Hip thrust', primaryMuscle: Muscle.GLUTES, secondaryMuscles: [Muscle.HAMSTRINGS], equipment: Equipment.BARBELL },
  { name: 'Elevación de gemelos', primaryMuscle: Muscle.CALVES, secondaryMuscles: [], equipment: Equipment.MACHINE },
  // Core
  { name: 'Plancha', primaryMuscle: Muscle.CORE, secondaryMuscles: [Muscle.SHOULDERS], equipment: Equipment.BODYWEIGHT },
];

async function main() {
  for (const e of exercises) {
    await prisma.exercise.upsert({
      where: { name: e.name },
      update: {
        primaryMuscle: e.primaryMuscle,
        secondaryMuscles: e.secondaryMuscles,
        equipment: e.equipment,
      },
      create: e,
    });
  }
  console.log(`✅ Seed OK — ${exercises.length} ejercicios en la librería.`);
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
