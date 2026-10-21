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
import { Textarea } from "@/components/ui/textarea"
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { CURRENCIES, parseAmountToCents, type Currency } from "@/lib/money"

import { useCreateAsset, useUpdateAsset } from "../hooks"
import { createAssetInputSchema, type Asset } from "../types"

/** Cents -> the text a person would type, e.g. 2550 -> "25.50". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Like parseAmountToCents, but a value of zero is allowed (an asset can be worth nothing now). */
function parseValueToCents(input: string): number | null {
  if (/^\s*0+(\.0{1,2})?\s*$/.test(input)) return 0
  return parseAmountToCents(input)
}

/** Add form, or edit form when `asset` is given. */
export function AssetDialog({ asset }: { asset?: Asset }) {
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const pending = createAsset.isPending || updateAsset.isPending
  const today = useToday() ?? ""

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(asset?.name ?? "")
  const [category, setCategory] = useState(asset?.category ?? "")
  const [currency, setCurrency] = useState<Currency>(asset?.currency ?? "USD")
  // null = untouched, so the field follows "today" without reading the clock during render.
  const [pickedDate, setPurchaseDate] = useState<string | null>(asset?.purchaseDate ?? null)
  const purchaseDate = pickedDate ?? today
  const [price, setPrice] = useState(asset ? toAmountText(asset.purchaseCents) : "")
  const [value, setValue] = useState(asset ? toAmountText(asset.currentValueCents) : "")
  const [notes, setNotes] = useState(asset?.notes ?? "")
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the asset (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(asset?.name ?? "")
    setCategory(asset?.category ?? "")
    setCurrency(asset?.currency ?? "USD")
    setPurchaseDate(asset?.purchaseDate ?? null)
    setPrice(asset ? toAmountText(asset.purchaseCents) : "")
    setValue(asset ? toAmountText(asset.currentValueCents) : "")
    setNotes(asset?.notes ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const purchaseCents = parseAmountToCents(price)
    if (purchaseCents === null) return setError("Enter a valid purchase price, e.g. 1200 or 1200.50.")
    const currentValueCents = parseValueToCents(value)
    if (currentValueCents === null) return setError("Enter a valid current value, e.g. 900 or 900.50.")

    const parsed = createAssetInputSchema.safeParse({
      name,
      category: category.trim() || undefined,
      currency,
      purchaseDate,
      purchaseCents,
      currentValueCents,
      notes: notes.trim() || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the asset. Try again.")),
    }
    if (asset) updateAsset.mutate({ id: asset.id, input: parsed.data }, handlers)
    else createAsset.mutate(parsed.data, handlers)
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
        {asset ? (
          <EditTrigger itemLabel={`asset “${asset.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{asset ? "Edit asset" : "Add asset"}</DialogTitle>
            <DialogDescription>Something you own. Update its current value when it changes.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-name">Name</Label>
              <Input
                id="asset-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                placeholder="e.g. Laptop, Car"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-category">Category (optional)</Label>
              <Input
                id="asset-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                maxLength={40}
                placeholder="e.g. Electronics, Vehicle"
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-date">Purchase date</Label>
              <Input
                id="asset-date"
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(next) => setCurrency(next as Currency)}>
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-price">Purchase price</Label>
              <Input
                id="asset-price"
                inputMode="decimal"
                placeholder="0.00"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="asset-value">Current value</Label>
              <Input
                id="asset-value"
                inputMode="decimal"
                placeholder="0.00"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-notes">Notes (optional)</Label>
            <Textarea
              id="asset-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : asset ? "Save changes" : "Save asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
