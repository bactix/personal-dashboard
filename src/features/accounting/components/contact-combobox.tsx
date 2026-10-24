"use client"

import type { ComponentProps } from "react"

import { ComboboxInput } from "@/components/dashboard/combobox-input"
import { useContacts } from "@/features/contacts"

type ContactComboboxProps = Omit<ComponentProps<typeof ComboboxInput>, "options">

/** Searchable pick from your Contacts (by name, phone or email); other names can still be typed. */
export function ContactCombobox(props: ContactComboboxProps) {
  const contacts = useContacts()
  const options = (contacts.data ?? []).map((contact) => ({
    label: contact.name,
    hint: [contact.phones[0], contact.emails[0]].filter(Boolean).join(" · ") || undefined,
  }))

  return (
    <ComboboxInput
      options={options}
      emptyMessage="No matching contact. The name you typed will be used."
      {...props}
    />
  )
}
