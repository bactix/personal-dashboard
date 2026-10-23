import { BillsList } from "./bills-list"

export function BillsPage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <BillsList />
      </div>
    </div>
  )
}
