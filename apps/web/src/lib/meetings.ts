import 'server-only';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
}

export class UnauthorizedError extends Error {}

async function get(path: string, token: string): Promise<Meeting[]> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`API ${path} responded ${res.status}`);
  return res.json();
}

export function fetchMeetings(token: string) {
  return get('/meetings', token);
}

export function fetchRecentMeetings(token: string) {
  return get('/meetings/recent', token);
}
