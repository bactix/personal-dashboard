"use client"

import { PlusIcon } from "lucide-react"
import { useState, type FormEvent } from "react"

import { EditTrigger } from "@/components/dashboard/edit-trigger"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { userMessage } from "@/lib/http/errors"

import { useCreateAccount, useUpdateAccount } from "../hooks"
import { createAccountInputSchema, type Account } from "../types"

/** Add form, or edit form when `account` is given. */
export function AccountDialog({ account }: { account?: Account }) {
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const pending = createAccount.isPending || updateAccount.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(account?.name ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the account (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(account?.name ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createAccountInputSchema.safeParse({ name })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the account. Try again.")),
    }
    if (account) updateAccount.mutate({ id: account.id, input: parsed.data }, handlers)
    else createAccount.mutate(parsed.data, handlers)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        load()
      }}
    >
      <DialogTrigger asChild>
        {account ? (
          <EditTrigger itemLabel={`account “${account.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{account ? "Edit account" : "Add account"}</DialogTitle>
            <DialogDescription>
              Accounts group your transactions, e.g. Salary, Groceries or Rent.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="account-name">Account name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              aria-invalid={!!error}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : account ? "Save changes" : "Save account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
