import {
  ArrowLeftRightIcon,
  BookUserIcon,
  BriefcaseIcon,
  ChartColumnIcon,
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
  PiggyBankIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  SettingsIcon,
  TargetIcon,
  UserIcon,
  WalletIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  /** Omit for a pure group header (e.g. "Financial") that only expands. */
  href?: string
  icon: LucideIcon
  children?: { title: string; href: string; icon?: LucideIcon }[]
}

/** Single source of truth for the sidebar. Add a page here, then create its route. */
export const navigation: NavItem[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  {
    title: "Financial",
    icon: LandmarkIcon,
    children: [
      { title: "Debts", href: "/financial/debts", icon: HandCoinsIcon },
      { title: "Wallets", href: "/financial/wallets", icon: WalletIcon },
      { title: "Accounts", href: "/financial/accounts", icon: BookUserIcon },
      { title: "Transactions", href: "/financial/transactions", icon: ArrowLeftRightIcon },
      { title: "Subscriptions", href: "/financial/subscriptions", icon: RepeatIcon },
      { title: "Invoices", href: "/financial/invoices", icon: FileTextIcon },
      { title: "Vendor bills", href: "/financial/vendor-bills", icon: ReceiptTextIcon },
      { title: "Assets", href: "/financial/assets", icon: GemIcon },
      { title: "Budgets", href: "/financial/budgets", icon: PiggyBankIcon },
      { title: "Goals", href: "/financial/goals", icon: TargetIcon },
    ],
  },
  {
    title: "Work",
    icon: BriefcaseIcon,
    children: [
      { title: "Projects", href: "/work/projects", icon: FolderKanbanIcon },
      { title: "Tasks", href: "/work/tasks", icon: ListChecksIcon },
      { title: "Help desk", href: "/work/help-desk", icon: LifeBuoyIcon },
    ],
  },
  {
    title: "Personal",
    icon: UserIcon,
    children: [
      { title: "Purchase", href: "/personal/purchase", icon: ShoppingCartIcon },
      { title: "Contacts", href: "/personal/contacts", icon: ContactIcon },
      { title: "Azkar", href: "/personal/azkar", icon: SunMoonIcon },
      { title: "Time machine", href: "/personal/timezone", icon: GlobeIcon },
    ],
  },
  { title: "Automations", href: "/automations", icon: WorkflowIcon },
  { title: "Stats", href: "/stats", icon: ChartColumnIcon },
  { title: "Data", href: "/data", icon: DatabaseIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
]
