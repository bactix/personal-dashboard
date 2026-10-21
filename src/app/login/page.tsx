import type { Metadata } from "next"

import { LoginForm } from "@/features/auth"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <LoginForm next={next} />
    </main>
  )
}
