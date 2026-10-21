"use client"

import { DeleteButton } from "@/components/dashboard/delete-button"
import { ListPagination } from "@/components/dashboard/list-pagination"
import { WidgetCard } from "@/components/dashboard/widget-card"
import { usePagination } from "@/hooks/use-pagination"

import { useContacts, useDeleteContact } from "../hooks"
import { ContactDialog } from "./contact-dialog"

export function ContactsPage() {
  const query = useContacts()
  const deleteContact = useDeleteContact()
  const pagination = usePagination(query.data ?? [])

  return (
    <div className="px-4 lg:px-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <WidgetCard
          title="Contacts"
          description={query.data ? `${query.data.length} saved` : undefined}
          query={query}
          action={<ContactDialog />}
          isEmpty={query.data?.length === 0}
          emptyMessage="No contacts yet. Use Add contact to create one."
        >
          <ul className="divide-y">
            {pagination.pageItems.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium break-words">{contact.name}</span>
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                      className="w-fit text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No phone number</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  <ContactDialog contact={contact} />
                  <DeleteButton
                    itemLabel={`contact “${contact.name}”`}
                    onDelete={() => deleteContact.mutateAsync(contact.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
          <ListPagination pagination={pagination} />
        </WidgetCard>
      </div>
    </div>
  )
}
