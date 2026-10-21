"use client"

import {
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  DropletsIcon,
  SunIcon,
  WindIcon,
  type LucideIcon,
} from "lucide-react"

import { WidgetCard } from "@/components/dashboard/widget-card"

import { useWeather } from "../hooks"
import type { ConditionKey } from "../types"

const ICONS: Record<ConditionKey, LucideIcon> = {
  clear: SunIcon,
  "partly-cloudy": CloudSunIcon,
  cloudy: CloudIcon,
  fog: CloudFogIcon,
  drizzle: CloudDrizzleIcon,
  rain: CloudRainIcon,
  snow: CloudSnowIcon,
  thunderstorm: CloudLightningIcon,
}

const weekday = new Intl.DateTimeFormat("en", { weekday: "short" })

function dayLabel(isoDate: string, index: number) {
  if (index === 0) return "Today"
  // Parse as local noon so timezone shifts can't change the weekday.
  return weekday.format(new Date(`${isoDate}T12:00:00`))
}

export function WeatherWidget() {
  const query = useWeather()
  const data = query.data
  const CurrentIcon = data ? ICONS[data.current.condition] : SunIcon

  return (
    <WidgetCard title="Weather" description={data?.location ?? "Current conditions"} query={query}>
      {data && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <CurrentIcon className="size-12 text-primary" aria-hidden />
            <div>
              <p className="text-3xl font-semibold tabular-nums">
                {Math.round(data.current.temperatureC)}°C
              </p>
              <p className="text-sm text-muted-foreground">
                {data.current.conditionLabel} · feels like {Math.round(data.current.feelsLikeC)}°
              </p>
            </div>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <DropletsIcon className="size-4" aria-hidden />
              {Math.round(data.current.humidityPct)}%
            </span>
            <span className="flex items-center gap-1">
              <WindIcon className="size-4" aria-hidden />
              {Math.round(data.current.windKph)} km/h
            </span>
          </div>

          <ul className="grid grid-cols-5 gap-1 text-center text-xs">
            {data.daily.map((day, i) => {
              const DayIcon = ICONS[day.condition]
              return (
                <li key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-muted-foreground">{dayLabel(day.date, i)}</span>
                  <DayIcon className="size-5" aria-label={day.conditionLabel} />
                  <span className="tabular-nums">
                    {Math.round(day.maxC)}°{" "}
                    <span className="text-muted-foreground">{Math.round(day.minC)}°</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </WidgetCard>
  )
}
