'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, updateWeightUnit } from '@/lib/auth';
import type { WeightUnit } from '@/lib/units';

const STORAGE_KEY = 'boxit_unit';

type UnitContextValue = { unit: WeightUnit; setUnit: (u: WeightUnit) => void };
const UnitContext = createContext<UnitContextValue | null>(null);

function readCached(): WeightUnit {
  if (typeof window === 'undefined') return 'KG';
  return window.localStorage.getItem(STORAGE_KEY) === 'LB' ? 'LB' : 'KG';
}

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<WeightUnit>('KG');

  useEffect(() => {
    // cache local (evita parpadeo) y luego el server como fuente de verdad
    setUnitState(readCached());
    getMe()
      .then((u) => {
        if (u) {
          setUnitState(u.weightUnit);
          window.localStorage.setItem(STORAGE_KEY, u.weightUnit);
        }
      })
      .catch(() => {});
  }, []);

  const setUnit = (u: WeightUnit) => {
    setUnitState(u);
    window.localStorage.setItem(STORAGE_KEY, u);
    updateWeightUnit(u).catch(() => {});
  };

  return (
    <UnitContext.Provider value={{ unit, setUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit(): UnitContextValue {
  return useContext(UnitContext) ?? { unit: 'KG', setUnit: () => {} };
}
