'use client';

import {
  Button,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from '@heroui/react';
import { useState } from 'react';

interface PasswordFieldProps {
  autoComplete: 'new-password' | 'current-password';
  placeholder?: string;
  hint?: string;
  validate: (value: string) => string | null;
}

export function PasswordField({
  autoComplete,
  placeholder,
  hint,
  validate,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      fullWidth
      isRequired
      name="password"
      autoComplete={autoComplete}
      validate={validate}
    >
      <Label>Пароль</Label>
      <InputGroup fullWidth className="h-11">
        <InputGroup.Input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
        />
        <InputGroup.Suffix className="pr-0">
          <Button
            isIconOnly
            variant="ghost"
            className="size-11! rounded-l-none"
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
            onPress={() => setVisible((v) => !v)}
          >
            <EyeIcon off={visible} />
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {hint && <Description>{hint}</Description>}
      <FieldError />
    </TextField>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}
