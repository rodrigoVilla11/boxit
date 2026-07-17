import { TabBar } from '@/components/nav/tab-bar';
import { UnitProvider } from '@/components/unit-provider';
import { ToastProvider } from '@/components/toast-provider';
import { PreferencesProvider } from '@/components/preferences-provider';
import { RestTimerProvider } from '@/components/rest-timer-provider';
import { SyncProvider } from '@/components/sync-provider';
import { OfflineIndicator } from '@/components/offline-indicator';
import { RestSpacer } from '@/components/rest-spacer';

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
            <SyncProvider>
              <div className="app-shell min-h-dvh px-4 pb-[calc(4rem_+_env(safe-area-inset-bottom))]">
                {children}
                <RestSpacer />
                <TabBar />
              </div>
              <OfflineIndicator />
            </SyncProvider>
          </RestTimerProvider>
        </PreferencesProvider>
      </UnitProvider>
    </ToastProvider>
  );
}
