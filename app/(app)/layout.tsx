import { AppShell } from "@/components/app-shell";
import { isGrokConfigured } from "@/lib/grok";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} grokConfigured={isGrokConfigured()}>
      {children}
    </AppShell>
  );
}
