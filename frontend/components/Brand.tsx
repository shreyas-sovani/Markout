import Link from "next/link";

/** The Markout seal: a 24-second memory window and its reversion trace. */
export function Seal({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-card text-brand shadow-seal"
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        backgroundColor: "#ffffff",
        color: "#d97757",
        borderRadius: Math.max(9, size * 0.3),
        flexShrink: 0,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 36 36" width="76%" height="76%" fill="none">
        <path d="M5 25.5h26" stroke="#dcdad2" strokeWidth="1.5" />
        <path d="M6 25.5V11m24 14.5V11" stroke="#181817" strokeWidth="1.5" />
        <path d="M7 12.5c5 0 5 10.5 10.5 10.5S23 14 29 14" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
        <circle cx="17.5" cy="23" r="2.1" fill="#d97757" />
      </svg>
    </span>
  );
}

/** Clickable wordmark used in the nav. */
export function Wordmark({ href = "/", sub }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Seal />
      <span className="leading-tight" style={{ display: "flex", flexDirection: "column" }}>
        <span className="block font-sans text-[17px] font-extrabold tracking-[-0.04em] text-ink">
          Markout
        </span>
        {sub && (
          <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            {sub}
          </span>
        )}
      </span>
    </Link>
  );
}
