'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { PasswordField } from '@/components/ui/password-field';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const next =
        new URLSearchParams(window.location.search).get('next') || '/';
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <BrandMark className="text-4xl" />
        <h1 className="font-display text-xl font-semibold text-text">
          Entrá a tu cuenta
        </h1>
        <p className="text-sm text-textMuted">Seguí tu progreso, serie por serie.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          enterKeyHint="next"
          autoComplete="email"
          placeholder="vos@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          label="Contraseña"
          enterKeyHint="go"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} disabled={!email.trim() || !password}>
          Entrar
        </Button>
      </form>

      <p className="text-center text-sm text-textMuted">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-semibold text-primary">
          Creá una
        </Link>
      </p>
    </div>
  );
}
