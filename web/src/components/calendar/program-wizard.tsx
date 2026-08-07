'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarPlus, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useLockBody } from '@/hooks/use-lock-body';
import { useToast } from '@/components/toast-provider';
import { plural } from '@/lib/plural';
import { WEEKDAY_LABELS } from '@/lib/week';
import { activityIcon } from '@/lib/activity';
import {
  buildProgramSessions,
  PROGRAM_TEMPLATES,
  type ProgramTemplate,
} from '@/lib/program-templates';
import {
  createProgram,
  sessionDay,
  toDayStr,
  type TrainingProgram,
} from '@/lib/schedule';

/** Próximo lunes (o hoy si es lunes): arranque prolijo por defecto. */
function nextMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7;
  if (dow !== 0) d.setDate(d.getDate() + (7 - dow));
  return d;
}

const fmtDay = (d: Date): string =>
  d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

/**
 * Wizard de programas pre-armados: elegís el plan, la fecha de arranque y los
 * días de la semana → TODAS las sesiones entran al calendario de una.
 */
export function ProgramWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: TrainingProgram) => void;
}) {
  const toast = useToast();
  useLockBody(true);
  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [name, setName] = useState('');
  const [startStr, setStartStr] = useState(() => toDayStr(nextMonday()));
  const [days, setDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function pick(t: ProgramTemplate) {
    setTemplate(t);
    setName(t.name);
    setDays(t.defaultDays);
  }

  const start = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startStr);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }, [startStr]);

  const sessions = useMemo(
    () =>
      template && start && days.length === template.sessionsPerWeek
        ? buildProgramSessions(template, start, days)
        : [],
    [template, start, days],
  );

  function toggleDay(dow: number) {
    setDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow].sort(),
    );
  }

  async function submit() {
    if (!template || sessions.length === 0) return;
    setSaving(true);
    try {
      const program = await createProgram({
        name: name.trim() || template.name,
        note: template.goal,
        sessions,
      });
      onCreated(program);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos crear el programa.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Programa pre-armado"
      className="animate-sheet-in fixed inset-0 z-[60] flex flex-col bg-ink"
    >
      <header className="app-shell w-full px-4 pt-safe">
        <div className="flex items-center gap-3 pt-4">
          {template && (
            <button
              type="button"
              onClick={() => setTemplate(null)}
              aria-label="Volver"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="flex-1 font-display text-lg font-semibold text-text">
            {template ? template.name : 'Elegí un programa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-textMuted transition hover:text-text active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-shell w-full flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
        {!template ? (
          PROGRAM_TEMPLATES.map((t) => {
            const Icon = activityIcon(t.weeks[0].sessions[0].type);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t)}
                className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left transition hover:bg-surfaceRaised active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">{t.name}</p>
                  <p className="mt-0.5 text-xs text-textMuted">
                    {t.weeks.length} semanas · {t.sessionsPerWeek}/semana · {t.goal}
                  </p>
                  <p className="mt-1 text-xs text-textMuted">{t.summary}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-textMuted" />
              </button>
            );
          })
        ) : (
          <>
            <p className="text-sm text-textMuted">{template.summary}</p>

            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />

            <div>
              <label
                htmlFor="program-start"
                className="mb-1 block text-sm font-medium text-textMuted"
              >
                Empieza el
              </label>
              <input
                id="program-start"
                type="date"
                value={startStr}
                min={toDayStr(new Date())}
                onChange={(e) => setStartStr(e.target.value)}
                className="h-12 w-full rounded-2xl bg-surface px-4 text-sm text-text outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-textMuted">
                Días de entrenamiento ({days.length}/{template.sessionsPerWeek})
              </p>
              <div className="flex gap-1.5">
                {WEEKDAY_LABELS.map((label, dow) => {
                  const on = days.includes(dow);
                  return (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => toggleDay(dow)}
                      aria-pressed={on}
                      className={cn(
                        'h-11 flex-1 rounded-xl text-xs font-bold uppercase transition active:scale-95',
                        on
                          ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                          : 'bg-surface text-textMuted hover:text-text',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {days.length !== template.sessionsPerWeek && (
                <p className="mt-2 text-xs text-danger">
                  Elegí exactamente{' '}
                  {plural(template.sessionsPerWeek, 'día', 'días')} por semana.
                </p>
              )}
            </div>

            {sessions.length > 0 && (
              <div className="rounded-2xl bg-surface p-4 text-sm text-textMuted">
                Se van a programar{' '}
                <span className="font-semibold text-text">
                  {plural(sessions.length, 'sesión', 'sesiones')}
                </span>{' '}
                del{' '}
                <span className="font-semibold text-text">
                  {fmtDay(sessionDay(`${sessions[0].date}T12:00:00.000Z`))}
                </span>{' '}
                al{' '}
                <span className="font-semibold text-text">
                  {fmtDay(
                    sessionDay(`${sessions[sessions.length - 1].date}T12:00:00.000Z`),
                  )}
                </span>
                . Todo de una, listo para arrancar.
              </div>
            )}

            <Button
              onClick={submit}
              loading={saving}
              disabled={sessions.length === 0}
            >
              <CalendarPlus className="h-4 w-4" />
              Agregar al calendario
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
