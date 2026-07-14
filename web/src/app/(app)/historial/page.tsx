import { History } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function HistorialPage() {
  return (
    <ComingSoon
      title="Historial"
      icon={History}
      desc="Acá vas a ver tus entrenos pasados, el volumen por sesión y tus PRs."
    />
  );
}
