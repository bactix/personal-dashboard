import {
  ArrowLeftRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  ContactIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GemIcon,
  GlobeIcon,
  HandCoinsIcon,
  HomeIcon,
  RepeatIcon,
  LandmarkIcon,
  LifeBuoyIcon,
  ListChecksIcon,
  SunMoonIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  SettingsIcon,
  TargetIcon,
  UserIcon,
  WalletIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"

import { CowIcon } from "@/components/icons/cow-icon"

export type NavItem = {
  title: string
  /** For a group: its dashboard page (opened by the name; the arrow expands the sub-pages). */
  href?: string
  icon: LucideIcon
  children?: { title: string; href: string; icon?: LucideIcon }[]
  /** Expanded when the sidebar first loads, instead of only when it holds the current page. */
  defaultOpen?: boolean
  /** Not listed in the sidebar (the page still exists and still gets its header title). */
  hidden?: boolean
}

/** Single source of truth for the sidebar. Add a page here, then create its route. */
export const navigation: NavItem[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  {
    title: "Financial",
    href: "/financial",
    icon: LandmarkIcon,
    defaultOpen: true,
    children: [
      { title: "Transactions", href: "/financial/transactions", icon: ArrowLeftRightIcon },
      { title: "Debts", href: "/financial/debts", icon: HandCoinsIcon },
      { title: "Wallets", href: "/financial/wallets", icon: WalletIcon },
      { title: "Subscriptions", href: "/financial/subscriptions", icon: RepeatIcon },
      { title: "Budgets", href: "/financial/budgets", icon: CowIcon },
      { title: "Goals", href: "/financial/goals", icon: TargetIcon },
      { title: "Invoices", href: "/financial/invoices", icon: FileTextIcon },
      { title: "Vendor bills", href: "/financial/vendor-bills", icon: ReceiptTextIcon },
      { title: "Assets", href: "/financial/assets", icon: GemIcon },
    ],
  },
  {
    title: "Work",
    href: "/work",
    icon: BriefcaseIcon,
    children: [
      { title: "Projects", href: "/work/projects", icon: FolderKanbanIcon },
      { title: "Tasks", href: "/work/tasks", icon: ListChecksIcon },
      { title: "Help desk", href: "/work/help-desk", icon: LifeBuoyIcon },
    ],
  },
  {
    title: "Personal",
    href: "/personal",
    icon: UserIcon,
    defaultOpen: true,
    children: [
      { title: "Purchase", href: "/personal/purchase", icon: ShoppingCartIcon },
      { title: "Contacts", href: "/personal/contacts", icon: ContactIcon },
      { title: "Azkar", href: "/personal/azkar", icon: SunMoonIcon },
      { title: "Stash", href: "/personal/stash", icon: BookmarkIcon },
      { title: "Time machine", href: "/personal/timezone", icon: GlobeIcon },
    ],
  },
  { title: "Automations", href: "/automations", icon: WorkflowIcon },
  // Reachable only by adding ?debug=1 to the URL (see app/(app)/data/page.tsx).
  { title: "Data", href: "/data", icon: DatabaseIcon, hidden: true },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
]
