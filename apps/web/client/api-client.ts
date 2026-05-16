export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type ErrorPayload = {
  message?: string | string[]
}

const MESSAGE_MAP: Record<string, string> = {
  "Invalid credentials": "Неверный email или пароль.",
  "Invalid token": "Недействительный токен авторизации.",
  "User already exists": "Пользователь с таким email уже существует.",
  Unauthorized: "Вы не авторизованы. Выполните вход.",
  unauthorized: "Вы не авторизованы. Выполните вход.",
  Forbidden: "Недостаточно прав для выполнения действия.",
  forbidden: "Недостаточно прав для выполнения действия.",
  "email must be an email": "Некорректный формат email.",
  "password must be longer than or equal to 8 characters":
    "Пароль должен быть не короче 8 символов.",
  "password must be a string": "Пароль должен быть строкой.",
}

function translateMessage(message: string) {
  const t = message.trim()
  return MESSAGE_MAP[t] ?? MESSAGE_MAP[t.toLowerCase()] ?? t
}

function normalizeMessage(message: string) {
  const trimmed = message.trim()
  if (!trimmed) return "Ошибка запроса."
  if (/[.!?]$/.test(trimmed)) return trimmed
  return `${trimmed}.`
}

function resolveErrorMessage(status: number, payload: ErrorPayload | null) {
  if (payload?.message) {
    if (Array.isArray(payload.message)) {
      const normalized = payload.message
        .map(translateMessage)
        .map(normalizeMessage)
      return normalized.join(" ")
    }
    return normalizeMessage(translateMessage(payload.message))
  }

  if (status === 401) return "Вы не авторизованы. Выполните вход."
  if (status === 403) return "Недостаточно прав для выполнения действия."
  if (status === 404) return "Запрошенный ресурс не найден."
  if (status >= 500) return "Ошибка сервера. Попробуйте позже."
  return "Ошибка запроса."
}

export class ApiClient {
  protected readonly baseUrl: string

  constructor(baseUrl?: string) {
    const resolvedBaseUrl = baseUrl ?? process.env.NEXT_PUBLIC_API_URL
    if (!resolvedBaseUrl) {
      throw new ApiError("NEXT_PUBLIC_API_URL не настроен", 0)
    }
    this.baseUrl = resolvedBaseUrl
  }

  protected async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response

    try {
      const headers = new Headers(init?.headers)
      const isFormDataBody =
        typeof FormData !== "undefined" && init?.body instanceof FormData

      if (!isFormDataBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
      }

      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        cache: "no-store",
        headers,
      })
    } catch {
      throw new ApiError("Ошибка сети. Проверьте подключение и попробуйте снова.", 0)
    }

    const payload = (await response.json().catch(() => null)) as T | ErrorPayload | null

    if (!response.ok) {
      const message = resolveErrorMessage(response.status, payload as ErrorPayload | null)
      throw new ApiError(message, response.status)
    }

    return payload as T
  }
}
