import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-hmif border-t-ink" />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
