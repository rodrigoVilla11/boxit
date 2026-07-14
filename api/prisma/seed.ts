import { PrismaClient, Muscle, Equipment } from '@prisma/client';

const prisma = new PrismaClient();

type SeedExercise = {
  name: string;
  primaryMuscle: Muscle;
  equipment: Equipment;
};

// Librería semilla — ~20 ejercicios base (nombres en español rioplatense)
const exercises: SeedExercise[] = [
  // Pecho
  { name: 'Press de banca', primaryMuscle: Muscle.CHEST, equipment: Equipment.BARBELL },
  { name: 'Press inclinado con mancuernas', primaryMuscle: Muscle.CHEST, equipment: Equipment.DUMBBELL },
  { name: 'Aperturas en polea', primaryMuscle: Muscle.CHEST, equipment: Equipment.CABLE },
  { name: 'Fondos en paralelas', primaryMuscle: Muscle.CHEST, equipment: Equipment.BODYWEIGHT },
  // Espalda
  { name: 'Dominadas', primaryMuscle: Muscle.BACK, equipment: Equipment.BODYWEIGHT },
  { name: 'Remo con barra', primaryMuscle: Muscle.BACK, equipment: Equipment.BARBELL },
  { name: 'Jalón al pecho', primaryMuscle: Muscle.BACK, equipment: Equipment.CABLE },
  { name: 'Remo con mancuerna', primaryMuscle: Muscle.BACK, equipment: Equipment.DUMBBELL },
  // Hombros
  { name: 'Press militar', primaryMuscle: Muscle.SHOULDERS, equipment: Equipment.BARBELL },
  { name: 'Elevaciones laterales', primaryMuscle: Muscle.SHOULDERS, equipment: Equipment.DUMBBELL },
  // Bíceps
  { name: 'Curl de bíceps con barra', primaryMuscle: Muscle.BICEPS, equipment: Equipment.BARBELL },
  { name: 'Curl martillo', primaryMuscle: Muscle.BICEPS, equipment: Equipment.DUMBBELL },
  // Tríceps
  { name: 'Extensión de tríceps en polea', primaryMuscle: Muscle.TRICEPS, equipment: Equipment.CABLE },
  { name: 'Press francés', primaryMuscle: Muscle.TRICEPS, equipment: Equipment.BARBELL },
  // Piernas
  { name: 'Sentadilla', primaryMuscle: Muscle.QUADS, equipment: Equipment.BARBELL },
  { name: 'Prensa de piernas', primaryMuscle: Muscle.QUADS, equipment: Equipment.MACHINE },
  { name: 'Peso muerto', primaryMuscle: Muscle.HAMSTRINGS, equipment: Equipment.BARBELL },
  { name: 'Curl femoral', primaryMuscle: Muscle.HAMSTRINGS, equipment: Equipment.MACHINE },
  { name: 'Hip thrust', primaryMuscle: Muscle.GLUTES, equipment: Equipment.BARBELL },
  { name: 'Elevación de gemelos', primaryMuscle: Muscle.CALVES, equipment: Equipment.MACHINE },
  // Core
  { name: 'Plancha', primaryMuscle: Muscle.CORE, equipment: Equipment.BODYWEIGHT },
];

async function main() {
  for (const e of exercises) {
    await prisma.exercise.upsert({
      where: { name: e.name },
      update: { primaryMuscle: e.primaryMuscle, equipment: e.equipment },
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
