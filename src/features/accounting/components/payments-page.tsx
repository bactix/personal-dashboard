"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BillsList } from "./bills-list"
import { InvoicesList } from "./invoices-list"

export function PaymentsPage() {
  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="bills">Vendor bills</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices">
            <InvoicesList />
          </TabsContent>
          <TabsContent value="bills">
            <BillsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
