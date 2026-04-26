import { AppShell } from "@/components/app-shell"
import { ProtectedContent } from "@/components/protected-content"

export default function AdminPage() {
  return (
    <AppShell>
      <ProtectedContent title="Админка">
        Раздел админки пока в разработке.
      </ProtectedContent>
    </AppShell>
  )
}
