import Link from "next/link";
import { Seal } from "@/components/Brand";
import { APP_URL, BATCH_ROUTER, HOOK, ROUTER, TOKEN0, TOKEN1, POOL_MANAGER } from "@/lib/contracts";

/** Shared protocol footer. Server component: pure markup. */
export function SiteFooter() {
  const ex = (a: string) => `https://sepolia.etherscan.io/address/${a.toLowerCase()}`;
  return (
    <footer className="border-t border-ink bg-ink text-canvas">
      <div className="memory-ribbon opacity-80" aria-hidden />
      <div className="mx-auto max-w-content px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3">
              <Seal size={28} />
              <span className="font-sans text-[17px] font-extrabold tracking-[-0.04em] text-canvas">
                Markout
              </span>
            </div>
            <p className="mt-5 max-w-xs font-display text-[25px] font-normal leading-[1.12] tracking-[-0.025em] text-canvas">
              A pool with a short memory and a long view of liquidity.
            </p>
            <p className="mt-4 max-w-xs font-sans text-[12.5px] leading-relaxed text-canvas/55">
              Price stays: in-range LPs keep the premium. Price reverts: the trader gets it back.
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
              ["Batch child · Sepolia", ex(BATCH_ROUTER)],
              ["Faucet MDB · token0", ex(TOKEN0)],
              ["Faucet MDA · token1", ex(TOKEN1)],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 font-sans text-[11.5px] text-canvas/45 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Markout · UHI10</span>
          <span className="font-mono text-canvas/65">reverted ≥ 50% → refund · sustained → LPs</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-brand-bright">
        {title}
      </div>
      <ul className="mt-4 flex flex-col gap-2.5 font-sans text-[13px]">
        {items.map(([label, href]) => {
          const ext = href.startsWith("http");
          const cls = "text-canvas/65 transition-colors hover:text-canvas";
          return (
            <li key={label}>
              {ext ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {label} <span className="text-brand-bright">↗</span>
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
