import type { TokenResponse, LoginUserInput, CreateUserInput } from '@workspace/contracts/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка запроса' }));
    throw new Error(error.message ?? 'Ошибка запроса');
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  login: (data: LoginUserInput): Promise<TokenResponse> =>
    apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: CreateUserInput): Promise<TokenResponse> =>
    apiFetch<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string): Promise<TokenResponse> =>
    apiFetch<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};
