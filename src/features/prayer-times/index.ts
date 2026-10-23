// Public surface of the prayer-times feature. Server-only code lives in ./server
// and is deliberately NOT re-exported here.
export { PrayerTimesFab } from "./components/prayer-times-fab";
export { usePrayerTimes } from "./hooks";
export type { PrayerTimes } from "./types";
export { PrayerTimesWidget as PrayerTimesPage } from "./components/prayer-times-widget";
