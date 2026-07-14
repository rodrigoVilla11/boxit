import { TabBar } from '@/components/nav/tab-bar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell min-h-dvh px-4 pb-[calc(4rem_+_env(safe-area-inset-bottom))]">
      {children}
      <TabBar />
    </div>
  );
}
