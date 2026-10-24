"use client"

import { useRef, useState, type ComponentProps, type KeyboardEvent } from "react"

import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  /** What is written into the field when the option is picked. */
  label: string
  /** Optional second line (e.g. a phone number); also searched. */
  hint?: string
}

type ComboboxInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  /** Shown when nothing matches. The typed text is still kept as the value. */
  emptyMessage?: string
}

/**
 * Text field with a searchable list of options under it. Typing filters the list; picking an
 * option fills the field. Anything typed that isn't an option stays as free text, so it is
 * a suggestion list, not a closed select.
 */
export function ComboboxInput({
  value,
  onValueChange,
  options,
  emptyMessage = "No match. The text you typed will be used.",
  className,
  ...inputProps
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = value.trim().toLowerCase()
  const matches = options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) || option.hint?.toLowerCase().includes(query)
  )
  const highlighted = Math.min(active, Math.max(matches.length - 1, 0))

  function pick(option: ComboboxOption) {
    onValueChange(option.label)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      const step = event.key === "ArrowDown" ? 1 : -1
      setActive((current) => (matches.length === 0 ? 0 : (current + step + matches.length) % matches.length))
    } else if (event.key === "Enter" && open && matches[highlighted]) {
      // Pick the highlighted option instead of submitting the form.
      event.preventDefault()
      pick(matches[highlighted])
    } else if (event.key === "Escape" && open) {
      event.stopPropagation() // closes the list, not the surrounding dialog
      setOpen(false)
    }
  }

  return (
    <Popover open={open && options.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          {...inputProps}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className={className}
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="max-h-60 w-(--radix-popover-trigger-width) overflow-y-auto p-1"
        // Keep typing in the field: don't move focus into the list.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target instanceof Node && inputRef.current?.contains(event.target)) event.preventDefault()
        }}
      >
        {matches.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul role="listbox">
            {matches.map((option, index) => (
              <li key={`${option.label}-${index}`} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  // mousedown (not click) so the input doesn't lose focus first.
                  onMouseDown={(event) => {
                    event.preventDefault()
                    pick(option)
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex w-full flex-col items-start rounded-sm px-2 py-1.5 text-left text-sm",
                    index === highlighted && "bg-accent text-accent-foreground"
                  )}
                >
                  <span className="wrap-break-word">{option.label}</span>
                  {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
