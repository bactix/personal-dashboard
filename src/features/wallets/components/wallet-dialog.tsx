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
import { CURRENCIES, type Currency } from "@/lib/money"

import { useCreateWallet, useUpdateWallet } from "../hooks"
import { createWalletInputSchema, type Wallet } from "../types"

/** Add form, or edit form when `wallet` is given. */
export function WalletDialog({ wallet }: { wallet?: Wallet }) {
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const pending = createWallet.isPending || updateWallet.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(wallet?.name ?? "")
  const [currency, setCurrency] = useState<Currency>(wallet?.currency ?? "USD")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the wallet (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(wallet?.name ?? "")
    setCurrency(wallet?.currency ?? "USD")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createWalletInputSchema.safeParse({ name, currency })
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
