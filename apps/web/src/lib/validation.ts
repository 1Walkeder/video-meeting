const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string) {
  const email = value.trim();
  if (!email) return 'Введите email';
  if (!EMAIL_RE.test(email)) return 'Введите email в формате name@example.com';
  return null;
}

export function validateNewPassword(value: string) {
  if (!value) return 'Введите пароль';
  if (value.length < 8) return 'Пароль слишком короткий — минимум 8 символов';
  if (value.length > 128)
    return 'Пароль слишком длинный — максимум 128 символов';
  return null;
}

export function validateCurrentPassword(value: string) {
  return value ? null : 'Введите пароль';
}
