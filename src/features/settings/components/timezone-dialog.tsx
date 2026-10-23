"use client"

import { PlusIcon } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

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

import { useCitySearch, useCreateTimezone, useUpdateTimezone } from "../hooks"
import { createTimezoneInputSchema, type CityMatch, type Timezone } from "../types"

const SEARCH_DELAY_MS = 350

/** Add form, or edit form when `timezone` is given. The time zone comes from the picked city. */
export function TimezoneDialog({ timezone }: { timezone?: Timezone }) {
  const createTimezone = useCreateTimezone()
  const updateTimezone = useUpdateTimezone()
  const pending = createTimezone.isPending || updateTimezone.isPending

  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(timezone?.city ?? "")
  const [timeZone, setTimeZone] = useState(timezone?.timeZone ?? "")
  const [error, setError] = useState<string | null>(null)

  // The term actually searched: follows typing after a pause, and is cleared once a city is picked.
  const [term, setTerm] = useState("")
  const search = useCitySearch(term)

  useEffect(() => {
    const timer = setTimeout(() => setTerm(city.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [city])

  /** Fills the form from the item (edit) or clears it (add). Runs on open and close. */
  function load() {
    setCity(timezone?.city ?? "")
    setTimeZone(timezone?.timeZone ?? "")
    setTerm("")
    setError(null)
  }

  function pick(match: CityMatch) {
    setCity(match.name)
    setTimeZone(match.timeZone)
    setTerm("") // hides the results until the user types again
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!timeZone) return setError("Search for the city and pick it from the results.")
    const parsed = createTimezoneInputSchema.safeParse({ city, timeZone })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the time zone. Try again.")),
    }
    if (timezone) updateTimezone.mutate({ id: timezone.id, input: parsed.data }, handlers)
    else createTimezone.mutate(parsed.data, handlers)
  }

  // Hidden once a city is picked (the pick fills timeZone) and while the debounce is pending.
  const showResults = !timeZone && term.length >= 2 && term === city.trim()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        load()
      }}
    >
      <DialogTrigger asChild>
        {timezone ? (
          <EditTrigger itemLabel={`time zone “${timezone.city}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add city
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{timezone ? "Edit time zone" : "Add time zone"}</DialogTitle>
            <DialogDescription>
              Type a city and pick it from the results. Its time zone is filled in for you.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone-city">City</Label>
            <Input
              id="timezone-city"
              value={city}
              onChange={(event) => {
                setCity(event.target.value)
                setTimeZone("") // a new search invalidates the previous pick
              }}
              aria-invalid={!!error}
              maxLength={60}
              autoComplete="off"
              placeholder="Paris"
            />

            {showResults && (
              <div className="rounded-md border text-sm">
                {search.isPending ? (
                  <p className="p-3 text-muted-foreground">Searching…</p>
                ) : search.isError ? (
                  <p className="p-3 text-destructive">Could not search cities. Try again.</p>
                ) : search.data.length === 0 ? (
                  <p className="p-3 text-muted-foreground">No city found.</p>
                ) : (
                  <ul className="divide-y">
                    {search.data.map((match) => (
                      <li key={match.id}>
                        <button
                          type="button"
                          onClick={() => pick(match)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent"
                        >
                          <span className="font-medium">{match.name}</span>
                          <span className="text-muted-foreground">
                            {[match.area, match.timeZone].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Time zone:{" "}
            <span className="font-medium text-foreground">{timeZone || "not selected yet"}</span>
          </p>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : timezone ? "Save changes" : "Save time zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
