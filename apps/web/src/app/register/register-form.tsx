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
import { ApiError, register } from '@/lib/api';
import { validateEmail, validateNewPassword } from '@/lib/validation';

export function RegisterForm() {
  const router = useRouter();
  const summary = useInvalidSummary();
  const [isPending, setIsPending] = useState(false);
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    summary.clear();
    setIsPending(true);
    setError(undefined);
    setEmailError(undefined);
    try {
      await register(
        String(form.get('email')).trim(),
        String(form.get('password')),
      );
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailError('Пользователь с таким email уже существует');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось связаться с сервером. Попробуйте позже.');
      }
    } finally {
      setIsPending(false);
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-md gap-6 p-6 shadow-xl sm:p-8">
        <Card.Header className="gap-1.5">
          <Card.Title
            className="text-2xl font-bold"
            render={(props) => <h1 {...props} />}
          >
            Добро пожаловать!
          </Card.Title>
          <Card.Description className="text-foreground/70">
            Аккаунт создан, вы уже вошли в систему.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button
            autoFocus
            fullWidth
            size="lg"
            variant="primary"
            onPress={() => router.push('/')}
          >
            Перейти к встречам
          </Button>
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md gap-6 p-6 shadow-xl sm:p-8">
      <Card.Header className="gap-1.5">
        <Card.Title
          className="text-2xl font-bold"
          render={(props) => <h1 {...props} />}
        >
          Создать аккаунт
        </Card.Title>
        <Card.Description className="text-foreground/70">
          Введите email и придумайте пароль, чтобы начать.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        <Form
          className="flex flex-col gap-5"
          validationErrors={emailError ? { email: emailError } : undefined}
          onSubmit={onSubmit}
          onInvalid={summary.onInvalid}
        >
          <FormErrorSummary fields={summary.fields} />

          {error && (
            <Alert status="danger" role="alert">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Не удалось зарегистрироваться</Alert.Title>
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
            autoComplete="new-password"
            placeholder="Придумайте пароль"
            hint="От 8 до 128 символов"
            validate={validateNewPassword}
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
                {isPending ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-foreground/70">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="underline underline-offset-2">
              Войти
            </Link>
          </p>
        </Form>
      </Card.Content>
    </Card>
  );
}
