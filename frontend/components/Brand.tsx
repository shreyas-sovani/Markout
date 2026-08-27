import Link from "next/link";

/** The Markout seal: a magenta tile with a cream reversion mark. */
export function Seal({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl bg-brand font-display font-bold leading-none text-canvas shadow-seal"
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        fontSize: size * 0.56,
        backgroundColor: "#B5276F",
        color: "#faf8f2",
        borderRadius: 12,
        flexShrink: 0,
      }}
    >
      M
    </span>
  );
}

/** Clickable wordmark used in the nav. */
export function Wordmark({ href = "/", sub }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Seal />
      <span className="leading-tight" style={{ display: "flex", flexDirection: "column" }}>
        <span className="block font-display text-[19px] font-semibold tracking-tightest text-ink">
          Markout
        </span>
        {sub && (
          <span className="block font-sans text-[10.5px] uppercase tracking-[0.18em] text-faint">
            {sub}
          </span>
        )}
      </span>
    </Link>
  );
}
