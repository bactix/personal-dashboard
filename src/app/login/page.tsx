import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginForm } from "@/features/auth"

export const metadata: Metadata = { title: "Sign in" }

// searchParams is runtime data, so it is read inside Suspense and the page shell can prerender.
async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <LoginForm next={next} />
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Suspense>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
