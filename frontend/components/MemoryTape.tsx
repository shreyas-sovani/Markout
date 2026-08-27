"use client";

import { tickToPrice } from "@/lib/contracts";

/**
 * The 24-second memory tape on Lambda paper: live ink trace of the pool tick,
 * the trade's fixed window, pre/post/50%-frontier lines, the window average,
 * and the verdict once terminal. Countdown-correct geometry from chain time.
 */
export function MemoryTape({
  trace,
  chainNow,
  pre,
  post,
  windowAvg,
  bondTime,
  settleAfter,
  outcome,
}: {
  trace: { t: number; tick: number }[];
  chainNow: bigint;
  pre: number | null;
  post: number | null;
  windowAvg: number | null;
  bondTime: bigint;
  settleAfter: bigint;
  outcome: number;
}) {
  const W = 720;
  const H = 240;
  const PAD_L = 58;
  const PAD_R = 14;
  const PAD_Y = 26;
  const SPAN = 180; // seconds visible

  const now = chainNow > 0n ? Number(chainNow) : null;
  const x = (t: number) => PAD_L + ((t - (now ?? t)) / SPAN) * (W - PAD_L - PAD_R);

  const ticks: number[] = trace.map((p) => p.tick);
  if (pre !== null) ticks.push(pre);
  if (post !== null) ticks.push(post);
  if (windowAvg !== null) ticks.push(windowAvg);
  const lo = ticks.length ? Math.min(...ticks) - 10 : -10;
  const hi = ticks.length ? Math.max(...ticks) + 10 : 10;
  const y = (tick: number) => H - PAD_Y - ((tick - lo) / (hi - lo)) * (H - 2 * PAD_Y);

  const frontier = pre !== null && post !== null ? (pre + post) / 2 : null;

  const poly = trace
    .filter((p) => now === null || now - p.t <= SPAN)
    .map((p) => `${x(p.t).toFixed(1)},${y(p.tick).toFixed(1)}`)
    .join(" ");

  const showWindow = outcome === 0 && bondTime > 0n && settleAfter > 0n && now !== null;
  const wx1 = Math.min(x(Number(bondTime)), W - PAD_R);
  const wx2 = Math.min(x(Number(settleAfter)), W - PAD_R);
  const sweepX = showWindow ? Math.min(x(now!), Math.max(wx2, wx1)) : null;

  const grid = [0.2, 0.4, 0.6, 0.8];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Price memory tape"
      fill="none"
    >
      {/* graph-paper grid on cream */}
      {grid.map((f) => (
        <line
          key={f}
          x1={PAD_L}
          x2={W - PAD_R}
          y1={PAD_Y + f * (H - 2 * PAD_Y)}
          y2={PAD_Y + f * (H - 2 * PAD_Y)}
          stroke="#e9e4d6"
          strokeWidth="1"
        />
      ))}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={`v${f}`}
          x1={PAD_L + f * (W - PAD_L - PAD_R)}
          x2={PAD_L + f * (W - PAD_L - PAD_R)}
          y1={PAD_Y}
          y2={H - PAD_Y}
          stroke="#f0ebe0"
          strokeWidth="1"
        />
      ))}

      {/* trade lines */}
      {pre !== null && (
        <>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(pre)} y2={y(pre)} stroke="#9b988c" strokeWidth="1" strokeDasharray="5 4" />
          <text x={W - PAD_R - 4} y={y(pre) - 5} textAnchor="end" className="fill-[#6c6a5f] font-mono text-[10px]">
            pre {tickToPrice(pre).toFixed(5)}
          </text>
        </>
      )}
      {post !== null && (
        <>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(post)} y2={y(post)} stroke="#211d14" strokeWidth="1.4" strokeDasharray="7 4" />
          <text x={W - PAD_R - 4} y={y(post) + 13} textAnchor="end" className="fill-[#403d33] font-mono text-[10px]">
            post {tickToPrice(post).toFixed(5)}
          </text>
        </>
      )}
      {frontier !== null && (
        <>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(frontier)} y2={y(frontier)} stroke="#b07f25" strokeWidth="1" strokeDasharray="2 4" />
          <text x={PAD_L + 6} y={y(frontier) + 13} className="fill-[#a07d3a] font-mono text-[10px]">
            50% reversion frontier
          </text>
        </>
      )}

      {/* fixed window */}
      {showWindow && (
        <>
          <rect
            x={wx1}
            y={PAD_Y - 12}
            width={Math.max(wx2 - wx1, 2)}
            height={H - 2 * PAD_Y + 24}
            fill="rgba(181,39,111,0.05)"
            stroke="#B5276F"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={Math.min(wx1, W - 160) + 6} y={PAD_Y - 16} className="fill-[#B5276F] font-mono text-[10px]">
            fixed window · 24 s
          </text>
          {sweepX !== null && sweepX > wx1 && (
            <line x1={sweepX} x2={sweepX} y1={PAD_Y - 8} y2={H - PAD_Y + 8} stroke="#B5276F" strokeWidth="1.5" opacity="0.75" />
          )}
        </>
      )}

      {/* live trace */}
      {poly && (
        <polyline
          points={poly}
          stroke="#B5276F"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {/* window average marker */}
      {windowAvg !== null && (
        <g>
          <line x1={wx2 - 9} x2={wx2 + 9} y1={y(windowAvg)} y2={y(windowAvg)} stroke={outcome === 3 ? "#b07f25" : "#211d14"} strokeWidth="2.2" />
          <circle cx={wx2} cy={y(windowAvg)} r="4" fill={outcome === 3 ? "#b07f25" : "#211d14"} />
          <text x={wx2 + 13} y={y(windowAvg) + 4} className="fill-[#403d33] font-mono text-[10px]">
            window avg {tickToPrice(windowAvg).toFixed(5)}
          </text>
        </g>
      )}

      {/* live head dot */}
      {trace.length > 0 && (
        <circle cx={x(trace[trace.length - 1].t)} cy={y(trace[trace.length - 1].tick)} r="3.5" fill="#b07f25" />
      )}

      {/* verdict */}
      {outcome === 1 && (
        <text x={W / 2} y={H - 7} textAnchor="middle" className="fill-[#B5276F] font-mono text-[11px] font-semibold">
          bond → trader, paid at settle
        </text>
      )}
      {outcome === 3 && (
        <text x={W / 2} y={H - 7} textAnchor="middle" className="fill-[#a07d3a] font-mono text-[11px] font-semibold">
          bond → in-range LPs
        </text>
      )}
      {outcome === 2 && (
        <text x={W / 2} y={H - 7} textAnchor="middle" className="fill-[#B5276F] font-mono text-[11px] font-semibold">
          refund pending — retry claim
        </text>
      )}
    </svg>
  );
}
