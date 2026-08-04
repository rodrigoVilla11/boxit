'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  ChevronLeft,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Minus,
  Plus,
  Trash2,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { PasswordField } from '@/components/ui/password-field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SwitchVisual } from '@/components/ui/switch';
import { useUnit } from '@/components/unit-provider';
import { usePreferences } from '@/components/preferences-provider';
import { useToast } from '@/components/toast-provider';
import { ProfileCard } from '@/components/profile/profile-card';
import { ProfileForm } from '@/components/profile/profile-form';
import {
  changePassword,
  deleteAccount,
  getMe,
  logout,
  type SessionUser,
} from '@/lib/auth';
import { getBodyweights, type Bodyweight } from '@/lib/bodyweight';
import { exportCsv, exportJson } from '@/lib/export';
import type { WeightUnit } from '@/lib/units';

const UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'KG', label: 'Kilos (kg)' },
  { value: 'LB', label: 'Libras (lb)' },
];

export default function AjustesPage() {
  const router = useRouter();
  const { unit, setUnit } = useUnit();
  const prefs = usePreferences();
  const toast = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Perfil: la última pesada da peso, grasa e IMC
  const [latest, setLatest] = useState<Bodyweight | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  // Cambiar contraseña
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getMe().then(setUser).catch(() => {});
    // la lista viene del más nuevo al más viejo
    getBodyweights()
      .then((rows) => setLatest(rows[0] ?? null))
      .catch(() => {});
  }, []);

  async function savePassword() {
    if (curPw.length < 1 || newPw.length < 8) return;
    setSavingPw(true);
    try {
      await changePassword(curPw, newPw);
      setPwOpen(false);
      setCurPw('');
      setNewPw('');
      toast.success('Contraseña actualizada.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos cambiar la contraseña.');
    } finally {
      setSavingPw(false);
    }
  }

  async function doExport(kind: 'json' | 'csv') {
    if (exporting) return;
    setExporting(kind);
    try {
      await (kind === 'json' ? exportJson() : exportCsv());
    } catch {
      toast.error('No pudimos exportar tus datos.');
    } finally {
      setExporting(null);
    }
  }

  async function onDeleteAccount() {
    setConfirmDelete(false);
    try {
      await deleteAccount();
      router.replace('/register');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pudimos borrar la cuenta.');
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col pb-8">
      <header className="flex items-center gap-1 pt-safe">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:text-text"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="mt-5 font-display text-xl font-bold text-text">Ajustes</h1>
      </header>

      {/* Perfil */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-textMuted">Perfil</h2>
        {user === null ? (
          <div className="h-[9rem] animate-pulse rounded-2xl bg-surface" />
        ) : (
          <ProfileCard
            user={user}
            latest={latest}
            onEdit={() => setEditingProfile(true)}
          />
        )}
      </section>

      {/* Unidad de peso */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-textMuted">Unidad de peso</h2>
        <div className="flex gap-1 rounded-2xl bg-surface p-1">
          {UNITS.map((u) => (
            <button
              key={u.value}
              type="button"
              onClick={() => setUnit(u.value)}
              aria-pressed={unit === u.value}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
                unit === u.value ? 'bg-primary text-ink' : 'text-textMuted hover:text-text',
              )}
            >
              {u.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-textMuted">
          Los pesos se guardan en kg; el cambio es solo de visualización.
        </p>
      </section>

      {/* Descanso */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-textMuted">Descanso</h2>
        <div className="space-y-2">
          <ToggleRow
            icon={<Volume2 className="h-5 w-5 shrink-0 text-primary" />}
            title="Sonido al terminar"
            subtitle="Un beep cuando se acaba el descanso."
            on={prefs.sound}
            onToggle={() => prefs.setSound(!prefs.sound)}
          />
          <ToggleRow
            icon={<Bell className="h-5 w-5 shrink-0 text-primary" />}
            title="Notificación al terminar"
            subtitle="Aviso aunque tengas la app en segundo plano."
            on={prefs.notifications}
            onToggle={() => prefs.setNotifications(!prefs.notifications)}
          />
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text">
                Descanso por defecto
              </span>
              <span className="block text-xs text-textMuted">
                Se arranca al completar una serie.
              </span>
            </span>
            <button
              type="button"
              aria-label="Restar 15s"
              onClick={() => prefs.setDefaultRest(prefs.defaultRest - 15)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center font-display text-base font-semibold tabular-nums text-text">
              {Math.floor(prefs.defaultRest / 60)}:
              {String(prefs.defaultRest % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              aria-label="Sumar 15s"
              onClick={() => prefs.setDefaultRest(prefs.defaultRest + 15)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surfaceRaised text-text active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Seguridad y datos */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-textMuted">Cuenta y datos</h2>
        <div className="space-y-2">
          {pwOpen ? (
            <div className="space-y-3 rounded-2xl bg-surface p-4">
              <PasswordField
                label="Contraseña actual"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                autoComplete="current-password"
              />
              <PasswordField
                label="Nueva contraseña"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPwOpen(false);
                    setCurPw('');
                    setNewPw('');
                  }}
                  className="h-11 flex-1 rounded-2xl bg-surfaceRaised text-sm font-semibold text-textMuted transition active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={savePassword}
                  disabled={savingPw || newPw.length < 8 || !curPw}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary text-sm font-semibold text-ink transition active:scale-[0.98] disabled:opacity-60"
                >
                  {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}
                  {savingPw ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPwOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition active:scale-[0.99]"
            >
              <KeyRound className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1 text-sm font-medium text-text">
                Cambiar contraseña
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => doExport('json')}
              disabled={exporting !== null}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface p-3 text-sm font-medium text-text transition active:scale-[0.99] disabled:opacity-60"
            >
              {exporting === 'json' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={() => doExport('csv')}
              disabled={exporting !== null}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface p-3 text-sm font-medium text-text transition active:scale-[0.99] disabled:opacity-60"
            >
              {exporting === 'csv' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar CSV
            </button>
          </div>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition active:scale-[0.99]"
          >
            <Trash2 className="h-5 w-5 shrink-0 text-danger" />
            <span className="flex-1 text-sm font-medium text-danger">
              Borrar mi cuenta
            </span>
          </button>
        </div>
      </section>

      <div className="mt-6">
        <Button variant="ghost" onClick={onLogout} loading={loggingOut}>
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </Button>
      </div>

      {editingProfile && user && (
        <ProfileForm
          user={user}
          latest={latest}
          onClose={() => setEditingProfile(false)}
          onSaved={(updated, entry) => {
            setUser(updated);
            if (entry) setLatest(entry);
            setEditingProfile(false);
            toast.success('Perfil actualizado.');
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Borrar tu cuenta?"
        message="Se elimina tu cuenta y todos tus entrenos, rutinas y registros. No se puede deshacer."
        confirmLabel="Borrar todo"
        danger
        onConfirm={onDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  on,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left transition active:scale-[0.99]"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{title}</span>
        <span className="block text-xs text-textMuted">{subtitle}</span>
      </span>
      <SwitchVisual on={on} />
    </button>
  );
}
