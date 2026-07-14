import { ClipboardList } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export default function RutinasPage() {
  return (
    <ComingSoon
      title="Rutinas"
      icon={ClipboardList}
      desc="Vas a poder crear plantillas y empezar un entreno desde una rutina."
    />
  );
}
