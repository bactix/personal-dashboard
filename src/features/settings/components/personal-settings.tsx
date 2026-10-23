import { LogosCard } from "./logos-card"
import { SettingsSection } from "./settings-section"

/** Settings for the Personal module. */
export function PersonalSettings() {
  return (
    <SettingsSection title="Logos">
      <LogosCard />
    </SettingsSection>
  )
}
