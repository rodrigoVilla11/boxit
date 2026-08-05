'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getMe } from '@/lib/auth';

/**
 * Manda al onboarding a los usuarios que todavía no lo completaron. Client-side:
 * consulta getMe una vez y redirige si `onboardedAt` es null.
 */
export function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/onboarding') return;
    getMe()
      .then((u) => {
        if (u && u.onboardedAt === null) router.replace('/onboarding');
      })
      .catch(() => undefined);
  }, [pathname, router]);

  return null;
}
