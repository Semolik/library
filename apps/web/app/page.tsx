import Link from 'next/link'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center gap-10 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Базовая обёртка проекта готова
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Авторизация, контексты и state на общих типах.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Стартовая страница теперь ведёт в экран входа, а состояние
              аутентификации хранится централизованно через контекст и localStorage.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Перейти к авторизации
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Открыть форму входа</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Используются `packages/contracts/auth` и общий UI-кит.
          </div>
        </div>

        <div className="grid w-full max-w-md gap-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-base font-medium">Что уже есть</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• `ThemeProvider` в корневом layout</li>
              <li>• `AuthProvider` для токенов и пользователя</li>
              <li>• Страница `/login` с формой входа</li>
              <li>• Схемы и типы из `packages/contracts/auth`</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
