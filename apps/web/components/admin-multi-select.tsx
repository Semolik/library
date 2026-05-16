"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { AdminFormSelectOption } from "@/components/admin-form-select"

type AdminMultiSelectProps = {
  label: string
  hint?: React.ReactNode
  value: string[]
  onChange: (value: string[]) => void
  options: AdminFormSelectOption[]
  placeholder?: string
  disabled?: boolean
}

/**
 * Несколько значений через Select + бейджи (удобно для полей с множественным выбором).
 */
export function AdminMultiSelect({
  label,
  hint,
  value,
  onChange,
  options,
  placeholder = "Добавить из списка",
  disabled,
}: AdminMultiSelectProps) {
  const [pick, setPick] = React.useState("")

  const available = options.filter((o) => !value.includes(o.value))
  const selected = options.filter((o) => value.includes(o.value))

  function add(id: string) {
    if (!id || value.includes(id)) return
    onChange([...value, id])
    setPick("")
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {hint}
      <Select
        value={pick || undefined}
        onValueChange={(id) => {
          setPick(id)
          add(id)
        }}
        disabled={disabled || available.length === 0}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              available.length === 0 ? "Все варианты уже выбраны" : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[200]">
          <SelectGroup>
            {available.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
          {selected.map((opt) => (
            <Badge key={opt.value} variant="secondary" className="gap-1 pr-1">
              {opt.label}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                onClick={() => remove(opt.value)}
                disabled={disabled}
                aria-label={`Убрать ${opt.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Ничего не выбрано</p>
      )}
    </div>
  )
}
