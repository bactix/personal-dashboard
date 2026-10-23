"use client"

import { PlusIcon } from "lucide-react"
import Image from "next/image"
import { useState, type ChangeEvent, type FormEvent } from "react"

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

import { useCreateLogo, useUpdateLogo } from "../logo-hooks"
import {
  createLogoInputSchema,
  LOGO_MIME_TYPES,
  MAX_LOGO_BYTES,
  type Logo,
} from "../logo-types"

/** Add form, or edit form when `logo` is given. */
export function LogoDialog({ logo }: { logo?: Logo }) {
  const createLogo = useCreateLogo()
  const updateLogo = useUpdateLogo()
  const pending = createLogo.isPending || updateLogo.isPending

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(logo?.name ?? "")
  const [image, setImage] = useState(logo?.image ?? "")
  const [fileKey, setFileKey] = useState(0) // remounts the file input to clear it
  const [error, setError] = useState<string | null>(null)

  /** Fills the form from the logo (edit) or clears it (add). Runs on open and close. */
  function load() {
    setName(logo?.name ?? "")
    setImage(logo?.image ?? "")
    setFileKey((key) => key + 1)
    setError(null)
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!(LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      return setError("Choose a PNG, JPEG, WebP, GIF or SVG image")
    }
    if (file.size > MAX_LOGO_BYTES) return setError("Image is too large (max 1 MB)")

    const reader = new FileReader()
    reader.onload = () => {
      setImage(String(reader.result))
      setError(null)
    }
    reader.onerror = () => setError("Could not read that file")
    reader.readAsDataURL(file)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = createLogoInputSchema.safeParse({ name, image })
    if (!parsed.success) {
      return setError(image ? parsed.error.issues[0].message : "Choose a logo image")
    }

    setError(null)
    const handlers = {
      onSuccess: () => {
        setOpen(false)
        load()
      },
      onError: (caught: unknown) =>
        setError(userMessage(caught, "Could not save the logo. Try again.")),
    }
    if (logo) updateLogo.mutate({ id: logo.id, input: parsed.data }, handlers)
    else createLogo.mutate(parsed.data, handlers)
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
        {logo ? (
          <EditTrigger itemLabel={`logo “${logo.name}”`} />
        ) : (
          <Button size="sm">
            <PlusIcon /> Add logo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{logo ? "Edit logo" : "Add logo"}</DialogTitle>
            <DialogDescription>Give the logo a name and upload its image (max 1 MB).</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="logo-name">Name</Label>
            <Input
              id="logo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!error}
              maxLength={60}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="logo-file">Logo</Label>
            <Input
              key={fileKey}
              id="logo-file"
              type="file"
              accept={LOGO_MIME_TYPES.join(",")}
              onChange={onFile}
            />
            {image && (
              <div className="flex h-24 items-center justify-center rounded-md border bg-muted/40 p-2">
                <Image
                  src={image}
                  alt={name ? `${name} logo preview` : "Logo preview"}
                  width={160}
                  height={80}
                  unoptimized
                  className="max-h-full w-auto object-contain"
                />
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : logo ? "Save changes" : "Save logo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
