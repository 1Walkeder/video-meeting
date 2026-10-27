export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Nest отдаёт message строкой или массивом (ошибки class-validator).
    const message = Array.isArray(data?.message)
      ? data.message.join('. ')
      : (data?.message ?? 'Не удалось выполнить запрос');
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export function register(email: string, password: string) {
  return post<void>('/auth/register', { email, password });
}

export function login(email: string, password: string) {
  return post<void>('/auth/login', { email, password });
}

export function logout() {
  return post<void>('/auth/logout', {});
}
