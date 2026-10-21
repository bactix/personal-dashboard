"use client"

import { CheckIcon, MoonIcon, RotateCcwIcon, SunriseIcon } from "lucide-react"

import { ListPagination } from "@/components/dashboard/list-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePagination } from "@/hooks/use-pagination"

import { azkar } from "../data"
import { useAzkarProgress } from "../hooks"
import type { AzkarPeriod, Dhikr } from "../types"

function AzkarList({ period, items }: { period: AzkarPeriod; items: Dhikr[] }) {
  const pagination = usePagination(items)
  const progress = useAzkarProgress(period)

  // Totals come from the full list; only the rendered rows are paginated.
  const doneCount = items.filter((dhikr) => progress.countOf(dhikr.id) >= dhikr.repeat).length
  const anyProgress = items.some((dhikr) => progress.countOf(dhikr.id) > 0)

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="tabular-nums" aria-live="polite">
          {doneCount} of {items.length} done
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!anyProgress}
          onClick={() => progress.reset()}
        >
          <RotateCcwIcon /> Reset all
        </Button>
      </div>
      <ul className="divide-y">
        {pagination.pageItems.map((dhikr) => {
          const count = progress.countOf(dhikr.id)
          const done = count >= dhikr.repeat
          return (
            <li key={dhikr.id} className="flex flex-col gap-2 py-4 first:pt-0">
              <p dir="rtl" lang="ar" className="text-xl leading-loose whitespace-pre-line">
                {dhikr.arabic}
              </p>
              <p className="text-sm text-muted-foreground">{dhikr.translation}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant={done ? "secondary" : "default"}
                  size="sm"
                  disabled={done}
                  className="min-w-24 tabular-nums"
                  onClick={() => progress.increment(dhikr.id, dhikr.repeat)}
                  aria-label={`Count a reading: ${count} of ${dhikr.repeat}`}
                >
                  {done ? <CheckIcon /> : null}
                  {count} / {dhikr.repeat}
                </Button>
                {count > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Reset this counter"
                    onClick={() => progress.reset(dhikr.id)}
                  >
                    <RotateCcwIcon />
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <ListPagination pagination={pagination} />
    </>
  )
}

export function AzkarPage() {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardDescription>Daily remembrance · counters reset each day</CardDescription>
        <CardTitle>Azkar</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="morning">
          <TabsList>
            <TabsTrigger value="morning">
              <SunriseIcon /> Morning
            </TabsTrigger>
            <TabsTrigger value="evening">
              <MoonIcon /> Evening
            </TabsTrigger>
          </TabsList>
          <TabsContent value="morning" className="pt-2">
            <AzkarList period="morning" items={azkar.morning} />
          </TabsContent>
          <TabsContent value="evening" className="pt-2">
            <AzkarList period="evening" items={azkar.evening} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
