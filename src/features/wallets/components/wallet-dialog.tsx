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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { userMessage } from "@/lib/http/errors"
import { CURRENCIES, parseAmountToCents, type Currency } from "@/lib/money"

import { useCreateWallet, useUpdateWallet } from "../hooks"
import { createWalletInputSchema, type Wallet } from "../types"

/** Starting balance as the form shows it: empty when there is none. */
function startingText(cents: number | undefined): string {
  return cents ? (cents / 100).toFixed(2) : ""
}

/** Cents for the typed starting balance: blank or zero is 0, anything invalid is null. */
function parseStarting(text: string): number | null {
  const normalized = text.trim().replace(/,/g, "")
  if (normalized === "" || /^0+(\.0{1,2})?$/.test(normalized)) return 0
  return parseAmountToCents(normalized)
}

/** Add form, or edit form when `wallet` is given. */
export function WalletDialog({ wallet }: { wallet?: Wallet }) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const pending = createWallet.isPending || updateWallet.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(wallet?.name ?? "")
  const [currency, setCurrency] = useState<Currency>(wallet?.currency ?? "USD")
  const [starting, setStarting] = useState(startingText(wallet?.startingCents))
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the wallet (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(wallet?.name ?? "")
    setCurrency(wallet?.currency ?? "USD")
    setStarting(startingText(wallet?.startingCents))
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const startingCents = parseStarting(starting)
    if (startingCents === null) return setError("Enter a valid starting balance, e.g. 150.50")
    const parsed = createWalletInputSchema.safeParse({ name, currency, startingCents })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the wallet. Try again.")),
    }
    if (wallet) updateWallet.mutate({ id: wallet.id, input: parsed.data }, handlers)
    else createWallet.mutate(parsed.data, handlers)
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
        {wallet ? (
          <EditTrigger itemLabel={`wallet “${wallet.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{wallet ? "Edit wallet" : "Add wallet"}</DialogTitle>
            <DialogDescription>A place where your money lives.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="wallet-name">Wallet name</Label>
              <Input
                id="wallet-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                placeholder="e.g. Cash, Bank account"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger className="w-full" aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wallet-starting">Starting balance (optional)</Label>
            <Input
              id="wallet-starting"
              inputMode="decimal"
              autoComplete="off"
              value={starting}
              onChange={(event) => setStarting(event.target.value)}
              aria-invalid={!!error}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Money already in the wallet. Deposits and withdrawals count on top of it.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : wallet ? "Save changes" : "Save wallet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
