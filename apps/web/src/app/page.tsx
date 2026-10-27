import { Card } from '@heroui/react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { MeetingCard } from '@/components/meeting-card';
import {
  fetchMeetings,
  fetchRecentMeetings,
  type Meeting,
  UnauthorizedError,
} from '@/lib/meetings';

async function loadMeetings(token: string) {
  const [recent, all] = await Promise.all([
    fetchRecentMeetings(token),
    fetchMeetings(token),
  ]);
  return { recent, all };
}

function MeetingGrid({ meetings }: { meetings: Meeting[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((m) => (
        <li key={m.id}>
          <MeetingCard meeting={m} />
        </li>
      ))}
    </ul>
  );
}

export default async function Home() {
  // Токен лежит в httpOnly-cookie (см. src/lib/auth-proxy.ts); без него — на вход.
  const token = (await cookies()).get('accessToken')?.value;
  if (!token) redirect('/login');

  let data: Awaited<ReturnType<typeof loadMeetings>> | null = null;
  try {
    data = await loadMeetings(token);
  } catch (e) {
    // Просроченный/невалидный токен — тоже на вход.
    if (e instanceof UnauthorizedError) redirect('/login');
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">Video Meetings</span>
        <LogoutButton />
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 p-6">
        {!data ? (
          <p role="alert" className="text-danger">
            Не удалось загрузить встречи. Обновите страницу.
          </p>
        ) : data.all.length === 0 ? (
          <Card>
            <Card.Header>
              <Card.Title>У вас пока нет встреч</Card.Title>
              <Card.Description>
                Созданные встречи появятся здесь.
              </Card.Description>
            </Card.Header>
          </Card>
        ) : (
          <>
            <section
              aria-labelledby="recent-title"
              className="flex flex-col gap-4"
            >
              <h2 id="recent-title" className="text-xl font-semibold">
                Последние встречи
              </h2>
              <MeetingGrid meetings={data.recent} />
            </section>

            <section
              aria-labelledby="all-title"
              className="flex flex-col gap-4"
            >
              <h2 id="all-title" className="text-xl font-semibold">
                Все встречи{' '}
                <span className="text-base font-normal text-muted">
                  ({data.all.length})
                </span>
              </h2>
              <MeetingGrid meetings={data.all} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
