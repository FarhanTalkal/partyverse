import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xl font-bold tracking-tight">PartyVerse</p>
          <p className="mt-1 text-sm text-slate">
            Browser party games for friends and family.
          </p>
        </div>
        <div className="flex gap-5 text-sm text-slate">
          <Link href="/#modes" className="hover:text-ink">
            Modes
          </Link>
          <Link href="/#how" className="hover:text-ink">
            How to play
          </Link>
          <Link href="/setup" className="hover:text-ink">
            Play
          </Link>
        </div>
      </div>
    </footer>
  );
}
