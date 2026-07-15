import { PrismaClient, Muscle, Equipment } from '@prisma/client';

const prisma = new PrismaClient();

type SeedExercise = {
  name: string;
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  equipment: Equipment;
  description: string;
};

// Librería semilla — ~20 ejercicios base (nombres en español rioplatense)
const exercises: SeedExercise[] = [
  { name: 'Press de banca', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.TRICEPS, Muscle.SHOULDERS], equipment: Equipment.BARBELL, description: 'Acostado en el banco, bajá la barra al pecho y empujá hasta extender los brazos. Mantené los omóplatos retraídos.' },
  { name: 'Press inclinado con mancuernas', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.SHOULDERS, Muscle.TRICEPS], equipment: Equipment.DUMBBELL, description: 'En banco inclinado, empujá las mancuernas desde el pecho hacia arriba. Trabaja la parte alta del pecho.' },
  { name: 'Aperturas en polea', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.SHOULDERS], equipment: Equipment.CABLE, description: 'Con los brazos abiertos y codos semiflexionados, juntá las manos al frente apretando el pecho.' },
  { name: 'Fondos en paralelas', primaryMuscle: Muscle.CHEST, secondaryMuscles: [Muscle.TRICEPS, Muscle.SHOULDERS], equipment: Equipment.BODYWEIGHT, description: 'Suspendido en paralelas, bajá flexionando los codos y subí. Inclinate al frente para más pecho.' },
  { name: 'Dominadas', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS, Muscle.FOREARMS], equipment: Equipment.BODYWEIGHT, description: 'Colgado de la barra, traccioná hasta pasar el mentón por encima. Bajá controlado.' },
  { name: 'Remo con barra', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS, Muscle.FOREARMS], equipment: Equipment.BARBELL, description: 'Con el torso inclinado y espalda recta, llevá la barra al abdomen apretando la espalda.' },
  { name: 'Jalón al pecho', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS], equipment: Equipment.CABLE, description: 'Sentado, tirá de la barra hacia el pecho llevando los codos abajo y atrás.' },
  { name: 'Remo con mancuerna', primaryMuscle: Muscle.BACK, secondaryMuscles: [Muscle.BICEPS, Muscle.FOREARMS], equipment: Equipment.DUMBBELL, description: 'Apoyado en el banco, remá la mancuerna hacia la cadera con el codo pegado al cuerpo.' },
  { name: 'Press militar', primaryMuscle: Muscle.SHOULDERS, secondaryMuscles: [Muscle.TRICEPS, Muscle.CORE], equipment: Equipment.BARBELL, description: 'De pie, empujá la barra desde los hombros hasta arriba de la cabeza. Core firme.' },
  { name: 'Elevaciones laterales', primaryMuscle: Muscle.SHOULDERS, secondaryMuscles: [], equipment: Equipment.DUMBBELL, description: 'Subí las mancuernas a los lados hasta la altura de los hombros, codos apenas flexionados.' },
  { name: 'Curl de bíceps con barra', primaryMuscle: Muscle.BICEPS, secondaryMuscles: [Muscle.FOREARMS], equipment: Equipment.BARBELL, description: 'De pie, flexioná los codos subiendo la barra sin balancear el cuerpo.' },
  { name: 'Curl martillo', primaryMuscle: Muscle.BICEPS, secondaryMuscles: [Muscle.FOREARMS], equipment: Equipment.DUMBBELL, description: 'Con agarre neutro (palmas enfrentadas), flexioná los codos. Trabaja bíceps y antebrazo.' },
  { name: 'Extensión de tríceps en polea', primaryMuscle: Muscle.TRICEPS, secondaryMuscles: [], equipment: Equipment.CABLE, description: 'Con los codos pegados al cuerpo, extendé los brazos hacia abajo apretando el tríceps.' },
  { name: 'Press francés', primaryMuscle: Muscle.TRICEPS, secondaryMuscles: [], equipment: Equipment.BARBELL, description: 'Acostado, bajá la barra hacia la frente flexionando solo los codos y extendé.' },
  { name: 'Sentadilla', primaryMuscle: Muscle.QUADS, secondaryMuscles: [Muscle.GLUTES, Muscle.HAMSTRINGS, Muscle.CORE], equipment: Equipment.BARBELL, description: 'Con la barra en la espalda, bajá flexionando caderas y rodillas hasta al menos paralelo.' },
  { name: 'Prensa de piernas', primaryMuscle: Muscle.QUADS, secondaryMuscles: [Muscle.GLUTES, Muscle.HAMSTRINGS], equipment: Equipment.MACHINE, description: 'Empujá la plataforma extendiendo las piernas sin bloquear las rodillas del todo.' },
  { name: 'Peso muerto', primaryMuscle: Muscle.HAMSTRINGS, secondaryMuscles: [Muscle.GLUTES, Muscle.BACK, Muscle.FOREARMS], equipment: Equipment.BARBELL, description: 'Con espalda recta, levantá la barra desde el piso extendiendo cadera y rodillas.' },
  { name: 'Curl femoral', primaryMuscle: Muscle.HAMSTRINGS, secondaryMuscles: [Muscle.GLUTES], equipment: Equipment.MACHINE, description: 'Flexioná las rodillas llevando el talón hacia los glúteos contra la resistencia.' },
  { name: 'Hip thrust', primaryMuscle: Muscle.GLUTES, secondaryMuscles: [Muscle.HAMSTRINGS], equipment: Equipment.BARBELL, description: 'Con la espalda alta apoyada en un banco, empujá la cadera hacia arriba apretando glúteos.' },
  { name: 'Elevación de gemelos', primaryMuscle: Muscle.CALVES, secondaryMuscles: [], equipment: Equipment.MACHINE, description: 'Elevá los talones lo más alto posible y bajá controlado, estirando el gemelo.' },
  { name: 'Plancha', primaryMuscle: Muscle.CORE, secondaryMuscles: [Muscle.SHOULDERS], equipment: Equipment.BODYWEIGHT, description: 'Apoyado en antebrazos y punta de pies, mantené el cuerpo recto y el abdomen firme.' },
];

async function main() {
  for (const e of exercises) {
    await prisma.exercise.upsert({
      where: { name: e.name },
      update: {
        primaryMuscle: e.primaryMuscle,
        secondaryMuscles: e.secondaryMuscles,
        equipment: e.equipment,
        description: e.description,
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
