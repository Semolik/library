"use client"

import * as React from "react"

type AuthUser = {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

type AuthState = {
  isHydrated: boolean
  isAuthenticated: boolean
  token: string | null
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  setUser: (user: AuthUser) => void
  logout: () => void
}

const TOKEN_KEY = "library_auth_token"
const USER_KEY = "library_auth_user"

const AuthContext = React.createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [token, setToken] = React.useState<string | null>(null)
  const [user, setUser] = React.useState<AuthUser | null>(null)

  React.useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY)
    const savedUser = window.localStorage.getItem(USER_KEY)

    setToken(savedToken)
    if (!savedUser) {
      setUser(null)
      setIsHydrated(true)
      return
    }

    try {
      setUser(JSON.parse(savedUser) as AuthUser)
    } catch {
      window.localStorage.removeItem(USER_KEY)
      setUser(null)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const login = React.useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken)
    setUser(nextUser)
    window.localStorage.setItem(TOKEN_KEY, nextToken)
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }, [])

  const logout = React.useCallback(() => {
    setToken(null)
    setUser(null)
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
  }, [])

  const updateUser = React.useCallback((nextUser: AuthUser) => {
    setUser(nextUser)
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }, [])

  const value = React.useMemo<AuthState>(
    () => ({
      isHydrated,
      isAuthenticated: Boolean(token),
      token,
      user,
      login,
      setUser: updateUser,
      logout,
    }),
    [isHydrated, token, user, login, updateUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
