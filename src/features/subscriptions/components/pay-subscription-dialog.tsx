"use client"

import { HandCoinsIcon, ZapIcon } from "lucide-react"
import Link from "next/link"
import { useState, type FormEvent } from "react"

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
import { useWallets } from "@/features/wallets"
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { formatMoney } from "@/lib/money"

import { usePaySubscription } from "../hooks"
import { paySubscriptionInputSchema, type Subscription } from "../types"

/**
 * Pays one renewal of a subscription from a wallet. "pay" lets you pick the due date and the day
 * paid (so a late payment is recorded as late); "direct" pays the upcoming renewal today, on time,
 * and only asks which wallet.
 */
export function PaySubscriptionDialog({
  subscription,
  dueDate,
  mode,
}: {
  subscription: Subscription
  /** The renewal this payment covers by default. */
  dueDate: string
  mode: "pay" | "direct"
}) {
  const wallets = useWallets()
  const paySubscription = usePaySubscription()
  const today = useToday()
  const direct = mode === "direct"

  const [open, setOpen] = useState(false)
  const [walletId, setWalletId] = useState("")
  // "" = untouched, so the fields follow the defaults without reading the clock during render.
  const [pickedDue, setPickedDue] = useState("")
  const [pickedPaid, setPickedPaid] = useState("")
  const [error, setError] = useState<string | null>(null)

  const matching = (wallets.data ?? []).filter((wallet) => wallet.currency === subscription.currency)
  const noWallet = wallets.isSuccess && matching.length === 0
  const due = direct ? dueDate : pickedDue || dueDate
  const paid = direct ? (today ?? "") : pickedPaid || (today ?? "")

  function load() {
    setWalletId(matching.length === 1 ? matching[0].id : "")
    setPickedDue("")
    setPickedPaid("")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = paySubscriptionInputSchema.safeParse({ walletId, dueDate: due, paidDate: paid })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    paySubscription.mutate(
      { id: subscription.id, input: parsed.data },
      {
        onSuccess: () => {
          setOpen(false)
          load()
        },
        onError: (caught) => setError(userMessage(caught, "Could not record the payment. Try again.")),
      }
    )
  }

  const amount = formatMoney(subscription.amountCents, subscription.currency)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        load()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={direct ? "default" : "outline"}>
          {direct ? <ZapIcon /> : <HandCoinsIcon />} {direct ? "Direct pay" : "Pay"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{direct ? "Direct pay" : "Pay"} {subscription.name}</DialogTitle>
            <DialogDescription>
              {amount} is taken out of the wallet you choose and shows up in its transactions.
              {direct && ` Paid today, for the renewal due ${dueDate} — on time.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Wallet</Label>
            {noWallet ? (
              <p className="text-sm text-muted-foreground">
                No {subscription.currency} wallet yet.{" "}
                <Link href="/financial/wallets" className="underline underline-offset-4">
                  Add one first
                </Link>
                .
              </p>
            ) : (
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger className="w-full" aria-label="Wallet">
                  <SelectValue placeholder="Select a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {matching.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name} · {wallet.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {!direct && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sub-due-date">Renewal due</Label>
                <Input
                  id="sub-due-date"
                  type="date"
                  value={due}
                  onChange={(event) => setPickedDue(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sub-paid-date">Date paid</Label>
                <Input
                  id="sub-paid-date"
                  type="date"
                  value={paid}
                  onChange={(event) => setPickedPaid(event.target.value)}
                />
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={paySubscription.isPending || noWallet}>
              {paySubscription.isPending ? "Saving…" : `Pay ${amount}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
