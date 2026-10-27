import type { ReactNode } from 'react';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-24 text-white">
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

      <div className="absolute left-6 top-6 flex items-center gap-3 text-xl font-semibold">
        <span
          aria-hidden
          className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
        Video Meetings
      </div>

      <div className="relative flex w-full justify-center text-foreground">
        {children}
      </div>

      <p className="absolute bottom-5 text-sm text-white/80">
        © {new Date().getFullYear()} Video Meetings
      </p>
    </main>
  );
}
