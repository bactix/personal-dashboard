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

import { useCreateCurrency, useUpdateCurrency } from "../currency-hooks"
import { createCurrencyInputSchema, type CurrencySetting } from "../currency-types"

const codes: string[] =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("currency") : []

/** Add form, or edit form when `currency` is given. */
export function CurrencyDialog({ currency }: { currency?: CurrencySetting }) {
  const createCurrency = useCreateCurrency()
  const updateCurrency = useUpdateCurrency()
  const pending = createCurrency.isPending || updateCurrency.isPending

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState(currency?.code ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the item (edit) or clears it (add). Runs on open and close. */
  function load() {
    setCode(currency?.code ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createCurrencyInputSchema.safeParse({ code })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the currency. Try again.")),
    }
    if (currency) updateCurrency.mutate({ id: currency.id, input: parsed.data }, handlers)
    else createCurrency.mutate(parsed.data, handlers)
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
        {currency ? (
          <EditTrigger itemLabel={`currency ${currency.code}`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add currency
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{currency ? "Edit currency" : "Add currency"}</DialogTitle>
            <DialogDescription>Enter a 3-letter ISO currency code, e.g. EUR.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="currency-code">Currency code</Label>
            <Input
              id="currency-code"
              list="currency-options"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              aria-invalid={!!error}
              maxLength={3}
              placeholder="EUR"
            />
            <datalist id="currency-options">
              {codes.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : currency ? "Save changes" : "Save currency"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
