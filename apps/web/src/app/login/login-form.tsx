'use client';

import {
  Alert,
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  Link,
  Spinner,
  TextField,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FormErrorSummary,
  useInvalidSummary,
} from '@/components/form-error-summary';
import { PasswordField } from '@/components/password-field';
import { ApiError, login } from '@/lib/api';
import { validateCurrentPassword, validateEmail } from '@/lib/validation';

export function LoginForm() {
  const router = useRouter();
  const summary = useInvalidSummary();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    summary.clear();
    setIsPending(true);
    setError(undefined);
    try {
      await login(
        String(form.get('email')).trim(),
        String(form.get('password')),
      );
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Неверный email или пароль');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось связаться с сервером. Попробуйте позже.');
      }
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md gap-6 p-6 shadow-xl sm:p-8">
      <Card.Header className="gap-1.5">
        <Card.Title
          className="text-2xl font-bold"
          render={(props) => <h1 {...props} />}
        >
          Войти
        </Card.Title>
        <Card.Description className="text-foreground/80">
          Введите email и пароль от вашего аккаунта.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <Form
          className="flex flex-col gap-5"
          onSubmit={onSubmit}
          onInvalid={summary.onInvalid}
        >
          <FormErrorSummary fields={summary.fields} />

          {error && (
            <Alert status="danger" role="alert">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Не удалось войти</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}

          <TextField
            fullWidth
            isRequired
            name="email"
            type="email"
            autoComplete="email"
            validate={validateEmail}
          >
            <Label>Email</Label>
            <Input
              className="h-11"
              placeholder="you@example.com"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
            />
            <FieldError />
          </TextField>

          <PasswordField
            autoComplete="current-password"
            placeholder="Ваш пароль"
            validate={validateCurrentPassword}
          />

          <Button
            fullWidth
            type="submit"
            variant="primary"
            size="lg"
            isPending={isPending}
          >
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? 'Входим…' : 'Войти'}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-foreground/80">
            Нет аккаунта?{' '}
            <Link href="/register" className="underline underline-offset-2">
              Зарегистрироваться
            </Link>
          </p>
        </Form>
      </Card.Content>
    </Card>
  );
}
