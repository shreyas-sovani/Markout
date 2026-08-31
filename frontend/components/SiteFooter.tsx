import Link from "next/link";
import { Seal } from "@/components/Brand";
import { APP_URL, HOOK, ROUTER, TOKEN0, TOKEN1, POOL_MANAGER } from "@/lib/contracts";

/**
 * Editorial multi-column footer matching the landing's bordered rhythm.
 * Server component: pure markup.
 */
export function SiteFooter() {
  const ex = (a: string) => `https://sepolia.etherscan.io/address/${a.toLowerCase()}`;
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto max-w-content px-5 py-12 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <Seal size={28} />
              <span className="font-display text-[18px] font-semibold tracking-tightest text-ink">
                Markout
              </span>
            </div>
            <p className="mt-3 font-sans text-[13px] leading-relaxed text-muted">
              The pool that pays LPs when the price stays — and pays traders back when it
              doesn&apos;t.
            </p>
          </div>

          <FooterCol
            title="Product"
            items={[
              ["App", "/app"],
              ["Docs", "/docs"],
              ["Hosted · Vercel", APP_URL],
              ["GitHub", "https://github.com/shreyas-sovani/Markout"],
            ]}
          />
          <FooterCol
            title="Stack"
            items={[
              ["Uniswap v4", "https://docs.uniswap.org/contracts/v4/overview"],
              ["Canonical PoolManager", ex(POOL_MANAGER)],
              ["Sepolia", "https://sepolia.dev"],
            ]}
          />
          <FooterCol
            title="On-chain"
            items={[
              ["Hook · Sepolia", ex(HOOK)],
              ["Router · Sepolia", ex(ROUTER)],
              ["Faucet MDA · Sepolia", ex(TOKEN0)],
              ["Faucet MDB · Sepolia", ex(TOKEN1)],
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-edge/30 pt-6 font-sans text-[12px] text-faint sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Markout · UHI10</span>
          <span className="font-mono">reverted ≥ 50% → refund · sustained → LPs</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-faint">
        {title}
      </div>
      <ul className="mt-3 space-y-2 font-sans text-[13.5px]">
        {items.map(([label, href]) => {
          const ext = href.startsWith("http");
          const cls = "text-ink-soft transition-colors hover:text-brand";
          return (
            <li key={label}>
              {ext ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {label} <span className="text-faint">↗</span>
                </a>
              ) : (
                <Link href={href} className={cls}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
