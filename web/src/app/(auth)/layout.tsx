export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="app-shell flex min-h-dvh flex-col px-6 pt-safe pb-safe">
      <div className="flex flex-1 flex-col justify-center py-10">{children}</div>
    </main>
  );
}
