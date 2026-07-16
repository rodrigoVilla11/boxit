'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronLeft,
  Download,
  KeyRound,
  LogOut,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUnit } from '@/components/unit-provider';
import { usePreferences } from '@/components/preferences-provider';
import { useToast } from '@/components/toast-provider';
import {
  changePassword,
  deleteAccount,
  getMe,
  logout,
  updateProfile,
  type SessionUser,
} from '@/lib/auth';
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

  // Nombre editable
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Cambiar contraseña
  const [pwOpen, setPwOpen] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setNameInput(u?.name ?? '');
      })
      .catch(() => {});
  }, []);

  async function saveName() {
    const name = nameInput.trim();
    if (name.length < 2 || name === user?.name) {
      setEditingName(false);
      setNameInput(user?.name ?? '');
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateProfile({ name });
      setUser(updated);
      setEditingName(false);
      toast.success('Nombre actualizado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSavingName(false);
    }
  }

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
    setExporting(true);
    try {
      await (kind === 'json' ? exportJson() : exportCsv());
    } catch {
      toast.error('No pudimos exportar tus datos.');
    } finally {
      setExporting(false);
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

      {/* Cuenta */}
      {user && (
        <div className="mt-5 rounded-2xl bg-surface p-4 shadow-card">
          {editingName ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label="Nombre"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={60}
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                aria-label="Guardar nombre"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-ink disabled:opacity-40"
              >
                <Check className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-display font-semibold text-text">{user.name}</p>
                <p className="truncate text-sm text-textMuted">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNameInput(user.name);
                  setEditingName(true);
                }}
                aria-label="Editar nombre"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surfaceRaised text-textMuted hover:text-text"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

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
              <TextField
                label="Contraseña actual"
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                autoComplete="current-password"
              />
              <TextField
                label="Nueva contraseña"
                type="password"
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
                  className="h-11 flex-1 rounded-2xl bg-surfaceRaised text-sm font-semibold text-textMuted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={savePassword}
                  disabled={savingPw || newPw.length < 8 || !curPw}
                  className="h-11 flex-1 rounded-2xl bg-primary text-sm font-semibold text-ink disabled:opacity-40"
                >
                  {savingPw ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPwOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left"
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
              disabled={exporting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface p-3 text-sm font-medium text-text disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={() => doExport('csv')}
              disabled={exporting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface p-3 text-sm font-medium text-text disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left"
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
      className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{title}</span>
        <span className="block text-xs text-textMuted">{subtitle}</span>
      </span>
      <span
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition',
          on ? 'bg-primary' : 'bg-surfaceRaised',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
            on ? 'left-[1.125rem]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
