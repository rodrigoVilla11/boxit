// Carga la librería extendida de ejercicios (dataset wrkout/exercises.json,
// mapeado a los enums de BOX iT en prisma/data/exercises-wrkout.json).
//
// Idempotente y NO destructivo: createMany con skipDuplicates — los ejercicios
// que ya existen (por nombre) se dejan como están, nunca se pisan.
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
  const { count } = await prisma.exercise.createMany({
    data: rows.map((r) => ({ ...r, userId: null })),
    skipDuplicates: true,
  });
  console.log(
    `✅ Librería extendida: ${count} ejercicios nuevos (${rows.length - count} ya existían; globales: ${before} → ${before + count}).`,
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
