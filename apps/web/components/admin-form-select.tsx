"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"

export type AdminFormSelectOption = {
  value: string
  label: string
}

type AdminFormSelectProps = {
  id?: string
  label: string
  hint?: React.ReactNode
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  options: AdminFormSelectOption[]
}

/** Одиночный выбор через shadcn Select */
export function AdminFormSelect({
  id,
  label,
  hint,
  value,
  onValueChange,
  placeholder = "Выберите значение",
  disabled,
  options,
}: AdminFormSelectProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {hint}
      <Select value={value?.trim() ? value.trim() : undefined} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[200]">
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
