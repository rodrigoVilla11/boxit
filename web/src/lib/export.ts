import { getHistory, getPersonalRecords, getWorkoutById } from './workouts';
import { getBodyweights } from './bodyweight';

function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fullWorkouts() {
  const summaries = await getHistory();
  return Promise.all(summaries.map((s) => getWorkoutById(s.id)));
}

/** Descarga todo el historial (con series), peso corporal y récords en JSON. */
export async function exportJson(): Promise<void> {
  const [workouts, bodyweights, personalRecords] = await Promise.all([
    fullWorkouts(),
    getBodyweights().catch(() => []),
    getPersonalRecords().catch(() => []),
  ]);
  const data = {
    exportedAt: new Date().toISOString(),
    workouts,
    bodyweights,
    personalRecords,
  };
  download(`boxit-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Descarga las series (una fila por serie) en CSV, legible en Excel. */
export async function exportCsv(): Promise<void> {
  const workouts = await fullWorkouts();
  const rows: unknown[][] = [
    ['fecha', 'ejercicio', 'serie', 'tipo', 'peso_kg', 'reps', 'completada', 'rpe', 'nota'],
  ];
  for (const w of workouts) {
    const date = (w.finishedAt ?? w.startedAt)?.slice(0, 10) ?? '';
    for (const we of w.exercises) {
      we.sets.forEach((s, i) => {
        rows.push([
          date,
          we.exercise.name,
          i + 1,
          s.type,
          s.weight,
          s.reps,
          s.completed ? 'sí' : 'no',
          s.rpe ?? '',
          s.note ?? '',
        ]);
      });
    }
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  // BOM para que Excel detecte UTF-8
  download(`boxit-${stamp()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}
