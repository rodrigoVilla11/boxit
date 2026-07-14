'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/');
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
          Creá tu cuenta
        </h1>
        <p className="text-sm text-textMuted">Empezá a trackear tus entrenos hoy.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label="Nombre"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="vos@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-textMuted">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-semibold text-primary">
          Entrá
        </Link>
      </p>
    </div>
  );
}
