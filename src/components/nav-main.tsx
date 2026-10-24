"use client"

import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import type { NavItem } from "@/config/navigation"

/** Renders the sidebar from config: plain links, and collapsible groups with sub-links. */
export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const isActive = (href?: string) =>
    !!href && (pathname === href || pathname.startsWith(`${href}/`))

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon

            if (!item.children) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.href)}
                  >
                    <Link href={item.href ?? "#"}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            return (
              <Collapsible
                key={item.title}
                asChild
                // Closed by default; only the group holding the current page starts open.
                defaultOpen={
                  pathname === item.href || item.children.some((child) => isActive(child.href))
                }
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {item.href ? (
                    <>
                      {/* The name opens the group's dashboard page; the arrow only expands. */}
                      <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.href}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction
                          aria-label={`Show or hide ${item.title} pages`}
                          className="data-[state=open]:rotate-90"
                        >
                          <ChevronRightIcon />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                    </>
                  ) : (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <Icon />
                        <span>{item.title}</span>
                        <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.href}>
                          <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                            <Link href={child.href}>
                              {child.icon && <child.icon />}
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
