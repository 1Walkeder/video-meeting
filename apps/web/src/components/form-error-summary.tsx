'use client';

import { Alert } from '@heroui/react';
import { useState } from 'react';

interface InvalidField {
  id: string;
  label: string;
  message: string;
}

/** Собирает невалидные поля формы после неудачной отправки для сводки ошибок. */
export function useInvalidSummary() {
  const [fields, setFields] = useState<InvalidField[]>([]);

  function onInvalid(e: React.FormEvent<HTMLFormElement>) {
    setFields(
      Array.from(e.currentTarget.elements)
        .filter(
          (el): el is HTMLInputElement =>
            el instanceof HTMLInputElement && !el.validity.valid,
        )
        .map((el) => ({
          id: el.id,
          label: (el.labels?.[0]?.textContent ?? el.name).replace(/\*$/, ''),
          message: el.validationMessage,
        })),
    );
  }

  return { fields, onInvalid, clear: () => setFields([]) };
}

export function FormErrorSummary({ fields }: { fields: InvalidField[] }) {
  if (!fields.length) return null;
  return (
    <Alert status="danger" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Проверьте форму</Alert.Title>
        <Alert.Description>
          <ul className="list-disc pl-4">
            {fields.map((f) => (
              <li key={f.id}>
                <a
                  href={`#${f.id}`}
                  className="underline underline-offset-2"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(f.id)?.focus();
                  }}
                >
                  {f.label}
                </a>
                : {f.message}
              </li>
            ))}
          </ul>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
