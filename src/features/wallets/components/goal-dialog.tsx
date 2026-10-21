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
import { useToday } from "@/hooks/use-today"
import { userMessage } from "@/lib/http/errors"
import { CURRENCIES, parseAmountToCents, type Currency } from "@/lib/money"

import { useCreateGoal, useUpdateGoal } from "../hooks"
import { createGoalInputSchema, type Goal } from "../types"

/** Cents -> the text a person would type, e.g. 250000 -> "2500.00". */
const toAmountText = (cents: number) => (cents / 100).toFixed(2)

/** Add form, or edit form when `goal` is given. Adding a goal also creates its wallet. */
export function GoalDialog({ goal }: { goal?: Goal }) {
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const pending = createGoal.isPending || updateGoal.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(goal?.name ?? "")
  const [currency, setCurrency] = useState<Currency>(goal?.currency ?? "USD")
  const [target, setTarget] = useState(goal ? toAmountText(goal.targetCents) : "")
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "")
  const [error, setError] = useState<string | null>(null)
  const today = useToday()

  /** Fills the form from the goal (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(goal?.name ?? "")
    setCurrency(goal?.currency ?? "USD")
    setTarget(goal ? toAmountText(goal.targetCents) : "")
    setTargetDate(goal?.targetDate ?? "")
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const targetCents = parseAmountToCents(target)
    if (targetCents === null) return setError("Enter a valid target, e.g. 1500 or 1500.50.")

    const parsed = createGoalInputSchema.safeParse({
      name,
      currency,
      targetCents,
      targetDate: targetDate || undefined,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the goal. Try again.")),
    }
    if (goal) updateGoal.mutate({ id: goal.id, input: parsed.data }, handlers)
    else createGoal.mutate(parsed.data, handlers)
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
        {goal ? (
          <EditTrigger itemLabel={`goal “${goal.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{goal ? "Edit goal" : "Add goal"}</DialogTitle>
            <DialogDescription>
              {goal
                ? "Renaming the goal renames its wallet too."
                : "Something you're saving for. A wallet with the same name is created to hold the money."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="e.g. New laptop, Emergency fund"
            />
          </div>

          <div className="grid grid-cols-[1fr_6rem] gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input
                id="goal-target"
                inputMode="decimal"
                placeholder="0.00"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
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
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              // Only new goals must be in the future; an existing goal may already be past its date.
              min={goal ? undefined : (today ?? undefined)}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : goal ? "Save changes" : "Save goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
