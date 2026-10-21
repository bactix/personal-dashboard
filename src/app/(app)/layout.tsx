import type { ReactNode } from "react"

import { AppShell } from "@/components/dashboard/app-shell"

// Shared chrome (sidebar + header) for every signed-in page. /login lives outside this group.
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
