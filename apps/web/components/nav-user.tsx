"use client"

import {
  LogOut,
  MoreVertical,
  UserCircle,
  UserCircle2,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Badge } from "@workspace/ui/components/badge"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  SUPERUSER: "Суперпользователь",
  ADMIN: "Администратор библиотеки",
  LIBRARIAN: "Библиотекарь",
  USER: "Читатель",
}

function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role
}

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar?: string
    roles?: string[]
  }
  onLogout: () => void
}

function RoleBadges({ roles }: { roles: string[] }) {
  if (roles.length === 0) return null
  return (
    <div className="flex flex-wrap justify-start gap-0.5">
      {roles.map((role) => (
        <Badge
          key={role}
          variant="secondary"
          className="h-4 shrink-0 px-1 py-0 text-[10px] font-normal leading-none"
        >
          {roleLabel(role)}
        </Badge>
      ))}
    </div>
  )
}

export function NavUser({ user, onLogout }: NavUserProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              <UserCircle2 className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <MoreVertical className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="top"
        align="start"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex flex-col gap-1 px-2 py-1.5 text-left text-sm">
            <div className="flex items-start gap-2">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  <UserCircle2 className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 gap-0.5 text-left leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <div className="pl-10">
              <RoleBadges roles={user.roles ?? []} />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserCircle />
              Аккаунт
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
