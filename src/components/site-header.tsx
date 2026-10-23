"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LebanonDate } from "@/components/lebanon-date"
import { ThemeToggle } from "@/components/theme-toggle"
import { navigation } from "@/config/navigation"

/** Finds the page title for a path from the navigation config (longest matching href wins). */
function titleFor(pathname: string): string {
  const entries = navigation.flatMap((item) => [
    ...(item.href ? [{ title: item.title, href: item.href }] : []),
    ...(item.children ?? []),
  ])
  const match = entries
    .filter(({ href }) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match?.title ?? "Dashboard"
}

/** `actions` is a slot for extra header controls (rendered before the theme toggle). */
export function SiteHeader({ actions }: { actions?: ReactNode }) {
  const title = titleFor(usePathname())

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <LebanonDate />
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
