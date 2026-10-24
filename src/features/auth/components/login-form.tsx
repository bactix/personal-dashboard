"use client"

import { LockKeyholeIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { safeRedirectPath } from "@/lib/auth/redirect"
import { isApiError } from "@/lib/http/errors"

import { login } from "../api"
import { loginInputSchema } from "../types"

function messageFor(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 401) return "Incorrect email or password."
    if (error.status === 429) return "Too many attempts. Try again in a few minutes."
    if (error.status === 503) return "Login is not configured. Set the Supabase keys and AUTH_OWNER_EMAIL."
  }
  return "Could not sign in. Try again."
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = loginInputSchema.safeParse({ email, password })
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setError(null)
    setPending(true)
    try {
      await login(parsed.data)
      router.replace(safeRedirectPath(next))
      router.refresh()
    } catch (caught) {
      setError(messageFor(caught))
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <LockKeyholeIcon className="mx-auto mb-2 size-8" aria-hidden />
        <CardTitle className="text-xl">Personal Dashboard</CardTitle>
        <CardDescription>Sign in to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!error}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!error}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
