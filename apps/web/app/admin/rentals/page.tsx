"use client"

import { useState } from "react"
import { toast } from "sonner"
import { libraryClient, type LibraryRent } from "@/client/library-client"
import { AdminSectionGuard } from "@/components/admin-section-guard"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function AdminRentalsPage() {
  const [copyId, setCopyId] = useState("")
  const [userId, setUserId] = useState("")
  const [rentId, setRentId] = useState("")
  const [fineAmount, setFineAmount] = useState("")
  const [createdRent, setCreatedRent] = useState<LibraryRent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreateRent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const rent = await libraryClient.createRent({ copyId: copyId.trim(), userId: userId.trim() })
      setCreatedRent(rent)
      setRentId(rent.id)
      toast.success("Выдача создана")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать выдачу.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReturn() {
    if (!rentId.trim()) return
    setIsSubmitting(true)
    try {
      await libraryClient.returnRent(rentId.trim())
      toast.success("Книга возвращена")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось оформить возврат.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleFine() {
    if (!rentId.trim() || !fineAmount.trim()) return
    setIsSubmitting(true)
    try {
      await libraryClient.payFine(rentId.trim(), Number(fineAmount))
      toast.success("Штраф оплачен")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось провести оплату.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSectionGuard title="Выдачи и возвраты" description="Работа с rented_books, return_books и paid_rent_fines">
      <form onSubmit={handleCreateRent} className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="UUID экземпляра (copy_id)"
          value={copyId}
          onChange={(event) => setCopyId(event.target.value)}
          required
        />
        <Input
          placeholder="UUID пользователя (user_id)"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          required
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохраняем..." : "Создать выдачу"}
          </Button>
        </div>
      </form>

      <div className="space-y-2 rounded-lg border bg-card p-4 text-sm">
        {createdRent ? <p>Текущая выдача: {createdRent.id}</p> : null}
        <Input
          placeholder="UUID выдачи (rent_id)"
          value={rentId}
          onChange={(event) => setRentId(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleReturn}>
            Оформить возврат
          </Button>
          <Input
            type="number"
            placeholder="Сумма штрафа"
            value={fineAmount}
            onChange={(event) => setFineAmount(event.target.value)}
            className="w-48"
          />
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleFine}>
            Оплатить штраф
          </Button>
        </div>
      </div>
    </AdminSectionGuard>
  )
}
