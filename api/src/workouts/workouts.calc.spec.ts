import {
  CalcSet,
  computeDurationSec,
  computeVolume,
  computeWorkoutTotals,
  countCompletedSets,
} from './workouts.calc';

const set = (over: Partial<CalcSet> = {}): CalcSet => ({
  type: 'NORMAL',
  weight: 0,
  reps: 0,
  completed: false,
  ...over,
});

describe('computeVolume', () => {
  it('suma peso × reps de las series de trabajo completadas', () => {
    const sets = [
      set({ weight: 100, reps: 5, completed: true }), // 500
      set({ weight: 80, reps: 10, completed: true }), // 800
    ];
    expect(computeVolume(sets)).toBe(1300);
  });

  it('ignora series no completadas', () => {
    const sets = [
      set({ weight: 100, reps: 5, completed: true }), // 500
      set({ weight: 999, reps: 9, completed: false }), // ignorada
    ];
    expect(computeVolume(sets)).toBe(500);
  });

  it('excluye warmups aunque estén completados', () => {
    const sets = [
      set({ weight: 60, reps: 10, completed: true, type: 'WARMUP' }), // excluido
      set({ weight: 100, reps: 5, completed: true }), // 500
    ];
    expect(computeVolume(sets)).toBe(500);
  });

  it('soporta pesos decimales', () => {
    expect(computeVolume([set({ weight: 22.5, reps: 8, completed: true })])).toBe(180);
  });

  it('devuelve 0 sin series', () => {
    expect(computeVolume([])).toBe(0);
  });
});

describe('countCompletedSets', () => {
  it('cuenta solo series de trabajo completadas', () => {
    const sets = [
      set({ completed: true }),
      set({ completed: true }),
      set({ completed: false }),
      set({ completed: true, type: 'WARMUP' }), // no cuenta
    ];
    expect(countCompletedSets(sets)).toBe(2);
  });

  it('devuelve 0 sin completadas', () => {
    expect(countCompletedSets([set(), set({ type: 'WARMUP', completed: true })])).toBe(0);
  });
});

describe('computeDurationSec', () => {
  it('calcula segundos entre inicio y fin', () => {
    const start = new Date('2026-07-14T10:00:00Z');
    const end = new Date('2026-07-14T11:30:45Z');
    expect(computeDurationSec(start, end)).toBe(5445); // 1h30m45s
  });

  it('nunca es negativa si el fin es anterior al inicio', () => {
    const start = new Date('2026-07-14T11:00:00Z');
    const end = new Date('2026-07-14T10:00:00Z');
    expect(computeDurationSec(start, end)).toBe(0);
  });

  it('redondea a segundos', () => {
    const start = new Date('2026-07-14T10:00:00.000Z');
    const end = new Date('2026-07-14T10:00:01.600Z');
    expect(computeDurationSec(start, end)).toBe(2);
  });
});

describe('computeWorkoutTotals', () => {
  it('combina volumen y series completadas', () => {
    const sets = [
      set({ weight: 100, reps: 5, completed: true }), // vol 500
      set({ weight: 100, reps: 5, completed: true }), // vol 500
      set({ weight: 40, reps: 12, completed: true, type: 'WARMUP' }), // excluido
      set({ weight: 120, reps: 3, completed: false }), // ignorado
    ];
    expect(computeWorkoutTotals(sets)).toEqual({ totalVolume: 1000, totalSets: 2 });
  });
});
