import { Card } from '@heroui/react';
import type { Meeting } from '@/lib/meetings';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function pluralize(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'участник';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return 'участника';
  return 'участников';
}

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const count = meeting.participants.length;
  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="break-words font-semibold">
          {meeting.title}
        </Card.Title>
        <Card.Description>
          <time dateTime={meeting.date}>
            {dateFormat.format(new Date(meeting.date))} UTC
          </time>
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <span className="text-sm text-muted">
          {count} {pluralize(count)}
        </span>
      </Card.Footer>
    </Card>
  );
}
