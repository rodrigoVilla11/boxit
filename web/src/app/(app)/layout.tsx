import { TabBar } from '@/components/nav/tab-bar';
import { UnitProvider } from '@/components/unit-provider';
import { ToastProvider } from '@/components/toast-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <UnitProvider>
        <div className="app-shell min-h-dvh px-4 pb-[calc(4rem_+_env(safe-area-inset-bottom))]">
          {children}
          <TabBar />
        </div>
      </UnitProvider>
    </ToastProvider>
  );
}
