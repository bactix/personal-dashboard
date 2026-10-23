import { CurrenciesCard } from "./currencies-card"
import { SettingsSection } from "./settings-section"
import { TimezonesCard } from "./timezones-card"

/** Dashboard-wide settings that don't belong to a single module. */
export function GeneralSettings() {
  return (
    <>
      <SettingsSection title="Currencies">
        <CurrenciesCard />
      </SettingsSection>
      <SettingsSection title="Time zones">
        <TimezonesCard />
      </SettingsSection>
    </>
  )
}
