'use client';

import { Button, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/lib/api';

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onPress() {
    setIsPending(true);
    setFailed(false);
    try {
      await logout();
      router.replace('/login');
      router.refresh();
    } catch {
      setFailed(true);
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" isPending={isPending} onPress={onPress}>
        {({ isPending }) => (
          <>
            {isPending && <Spinner color="current" size="sm" />}
            {isPending ? 'Выходим…' : 'Выйти'}
          </>
        )}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          Не удалось выйти. Попробуйте ещё раз.
        </p>
      )}
    </div>
  );
}
