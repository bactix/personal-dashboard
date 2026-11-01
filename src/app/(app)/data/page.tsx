import { notFound } from "next/navigation"
import { Suspense } from "react"

import { BackupPage } from "@/features/backup"

type SearchParams = Promise<{ debug?: string }>

// The Data section is hidden from the sidebar: it only opens with ?debug=1 in the URL.
// searchParams is runtime data, so it is read inside Suspense and the page shell can prerender.
async function DebugOnly({ searchParams }: { searchParams: SearchParams }) {
  const { debug } = await searchParams
  if (debug !== "1") notFound()
  return <BackupPage />
}

export default function DataPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense>
      <DebugOnly searchParams={searchParams} />
    </Suspense>
  )
}
