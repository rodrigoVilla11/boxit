// Carga la librería extendida de ejercicios (dataset wrkout/exercises.json,
// traducido y mapeado a los enums de BOX iT en prisma/data/exercises-wrkout.json).
//
// Idempotente: upsert por nombre — crea los que faltan y actualiza músculos,
// equipamiento y descripción de los que ya están (mejoras al dataset se
// propagan re-corriéndolo). Nunca borra nada.
//
// Local:      pnpm db:seed:wrkout
// Easypanel:  node --experimental-strip-types prisma/seed-wrkout.ts
//             (desde la Terminal del servicio API, igual que el seed base)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, Muscle, Equipment } from '@prisma/client';

const prisma = new PrismaClient();

type Row = {
  name: string;
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  equipment: Equipment;
  description: string | null;
};

async function main() {
  // relativo al cwd (api/ en local, /app en el contenedor), como corre el seed base
  const file = join(process.cwd(), 'prisma', 'data', 'exercises-wrkout.json');
  const rows: Row[] = JSON.parse(readFileSync(file, 'utf8'));
  const before = await prisma.exercise.count({ where: { userId: null } });
  // upserts en tandas para no abrir 700 round-trips sueltos
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.$transaction(
      rows.slice(i, i + BATCH).map((r) =>
        prisma.exercise.upsert({
          where: { name: r.name },
          update: {
            primaryMuscle: r.primaryMuscle,
            secondaryMuscles: r.secondaryMuscles,
            equipment: r.equipment,
            description: r.description,
          },
          create: { ...r, userId: null },
        }),
      ),
    );
  }
  const after = await prisma.exercise.count({ where: { userId: null } });
  console.log(
    `✅ Librería extendida: ${rows.length} ejercicios al día (globales: ${before} → ${after}).`,
  );
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
