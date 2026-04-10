import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { Textarea } from "@workspace/ui/components/textarea"

function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex items-center rounded-lg border border-input shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 [&>[data-slot=input]]:border-0 [&>[data-slot=input]]:shadow-none [&>[data-slot=input]]:focus-visible:ring-0 [&>[data-slot=textarea]]:border-0 [&>[data-slot=textarea]]:shadow-none [&>[data-slot=textarea]]:focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex shrink-0 items-center justify-center [&>[data-slot=button]]:rounded-none [&>[data-slot=button]]:border-0 [&>[data-slot=button]]:shadow-none [&>[data-slot=button]]:focus-visible:ring-0 first:[&>[data-slot=button]]:rounded-l-[calc(var(--radius-lg)-2px)] last:[&>[data-slot=button]]:rounded-r-[calc(var(--radius-lg)-2px)]",
        className
      )}
      {...props}
    />
  )
}

function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        "text-muted-foreground flex items-center px-3 text-sm",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="textarea"
      className={cn(
        "border-0 shadow-none focus-visible:ring-0",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea }
