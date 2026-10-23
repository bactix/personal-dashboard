"use client"

import { SettingsIcon, UserIcon, type LucideIcon } from "lucide-react"
import { useState, type ComponentType } from "react"

import { cn } from "@/lib/utils"

import { GeneralSettings } from "./general-settings"
import { PersonalSettings } from "./personal-settings"

type SettingsGroup = { id: string; title: string; icon: LucideIcon; component: ComponentType }

/** Left-hand list: "General Settings" now; add a module's settings here when it gets some. */
const groups: SettingsGroup[] = [
  { id: "general", title: "General Settings", icon: SettingsIcon, component: GeneralSettings },
  { id: "personal", title: "Personal", icon: UserIcon, component: PersonalSettings },
]

export function SettingsPage() {
  const [activeId, setActiveId] = useState(groups[0].id)
  const active = groups.find((group) => group.id === activeId) ?? groups[0]
  const Content = active.component

  return (
    <div className="flex flex-col gap-4 px-4 md:flex-row md:gap-0 lg:px-6">
      <nav
        aria-label="Settings sections"
        className="flex shrink-0 gap-1 overflow-x-auto md:w-56 md:flex-col md:overflow-visible md:border-r md:pr-2"
      >
        {groups.map(({ id, title, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveId(id)}
            aria-current={id === active.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-accent",
              id === active.id && "bg-accent font-medium"
            )}
          >
            <Icon className="size-4" />
            {title}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1 md:pl-2">
        <Content />
      </div>
    </div>
  )
}
