import type { ReactNode } from "react"

import { AppShell } from "@/components/dashboard/app-shell"
import { NotificationsBell } from "@/features/notifications"
import { PrayerTimesFab } from "@/features/prayer-times"
import { HeaderClock } from "@/features/settings"

// Shared chrome (sidebar + header) for every signed-in page. /login lives outside this group.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      headerActions={
        <>
          <HeaderClock />
          <NotificationsBell />
        </>
      }
    >
      {children}
      <PrayerTimesFab />
    </AppShell>
  )
}
