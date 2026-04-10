import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Библиотека</h1>
          <p className="text-muted-foreground">Система управления библиотечным фондом</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/login">Войти</Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          (Нажмите <kbd>d</kbd> для смены темы)
        </p>
      </div>
    </div>
  )
}
