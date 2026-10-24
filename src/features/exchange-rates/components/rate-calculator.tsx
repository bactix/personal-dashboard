"use client"

import { useId, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** A typed number, or null for blank / not a number. Commas are ignored ("1,250.5"). */
function parse(text: string): number | null {
  const trimmed = text.replace(/,/g, "").trim()
  if (trimmed === "") return null
  const value = Number(trimmed)
  return Number.isFinite(value) && value >= 0 ? value : null
}

/** Two decimals for normal amounts; a few significant digits for tiny ones (1 LBP in USD). */
function format(value: number): string {
  return value >= 1 || value === 0 ? value.toFixed(2) : String(Number(value.toPrecision(3)))
}

/**
 * Two-way converter between US dollars and one currency: type an amount in either box and the
 * other fills in straight away. `perUsd` is how many units of the currency one dollar buys.
 */
export function RateCalculator({ code, perUsd }: { code: string; perUsd: number }) {
  const id = useId()
  const [usd, setUsd] = useState("")
  const [local, setLocal] = useState("")

  function onUsd(text: string) {
    setUsd(text)
    const amount = parse(text)
    setLocal(amount === null ? "" : format(amount * perUsd))
  }

  function onLocal(text: string) {
    setLocal(text)
    const amount = parse(text)
    setUsd(amount === null ? "" : format(amount / perUsd))
  }

  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label={`Convert between USD and ${code}`}>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-usd`} className="text-xs text-muted-foreground">
          USD
        </Label>
        <Input
          id={`${id}-usd`}
          inputMode="decimal"
          autoComplete="off"
          value={usd}
          onChange={(event) => onUsd(event.target.value)}
          placeholder="0.00"
          className="tabular-nums"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${id}-local`} className="text-xs text-muted-foreground">
          {code}
        </Label>
        <Input
          id={`${id}-local`}
          inputMode="decimal"
          autoComplete="off"
          value={local}
          onChange={(event) => onLocal(event.target.value)}
          placeholder="0.00"
          className="tabular-nums"
        />
      </div>
    </div>
  )
}
