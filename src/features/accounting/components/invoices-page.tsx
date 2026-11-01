import { InvoicesList } from "./invoices-list"

export function InvoicesPage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <InvoicesList />
      </div>
    </div>
  )
}
