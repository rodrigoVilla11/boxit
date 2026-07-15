import { TabBar } from '@/components/nav/tab-bar';
import { UnitProvider } from '@/components/unit-provider';
import { ToastProvider } from '@/components/toast-provider';
import { PreferencesProvider } from '@/components/preferences-provider';
import { RestTimerProvider } from '@/components/rest-timer-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <UnitProvider>
        <PreferencesProvider>
          <RestTimerProvider>
            <div className="app-shell min-h-dvh px-4 pb-[calc(4rem_+_env(safe-area-inset-bottom))]">
              {children}
              <TabBar />
            </div>
          </RestTimerProvider>
        </PreferencesProvider>
      </UnitProvider>
    </ToastProvider>
  );
}
