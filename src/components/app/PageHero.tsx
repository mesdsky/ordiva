import Image from "next/image";
import type { ReactNode } from "react";

// Dark photo header shared by the app pages, matching the landing hero.
export default function PageHero({
  eyebrow,
  title,
  accent,
  description,
  actions,
  aside,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] bg-deep text-white shadow-[0_30px_80px_-40px_rgba(16,47,41,0.6)]">
      <Image
        src="/ordiva-hero-bg.jpg"
        alt=""
        fill
        loading="eager"
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="-z-20 object-cover opacity-40"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-deep via-deep/85 to-ink/40" />
      <div className="dot-grid absolute inset-0 -z-10" />
      <div className="drift pointer-events-none absolute -top-24 -right-16 -z-10 h-72 w-72 rounded-full bg-moss/25 blur-3xl" />

      <div className="grid gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
        <div className="min-w-0 max-w-2xl">
          <p className="intro inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.22em] text-white/75 uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_10px_rgba(200,216,190,0.9)]" />
            {eyebrow}
          </p>

          <h1 className="intro-lines mt-5 text-4xl leading-[1] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            <span className="line-mask">
              <span style={{ ["--d" as string]: "80ms" }}>
                {title}
                {accent && (
                  <>
                    {" "}
                    <span className="font-serif font-normal tracking-[-0.02em] text-mint italic">{accent}</span>
                  </>
                )}
              </span>
            </span>
          </h1>

          {description && (
            <p style={{ ["--d" as string]: "200ms" }} className="intro mt-4 max-w-xl text-base leading-7 text-white/70">
              {description}
            </p>
          )}

          {actions && (
            <div style={{ ["--d" as string]: "280ms" }} className="intro mt-7 flex flex-wrap gap-3">
              {actions}
            </div>
          )}
        </div>

        {aside && (
          <div style={{ ["--d" as string]: "240ms" }} className="intro-scale min-w-0 lg:w-80">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}

// Primary and secondary button styles for use on the dark hero.
export const heroButton =
  "group inline-flex items-center gap-2 rounded-full bg-cream px-5 py-3 text-sm font-semibold text-forest shadow-[0_12px_30px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
export const heroButtonGhost =
  "inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/20";

// Glass stat card for the hero's aside slot.
export function HeroStat({
  label,
  value,
  children,
}: {
  label: string;
  value: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/20 bg-white/10 p-1.5 backdrop-blur-md">
      <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-white/55 uppercase">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] break-words text-white tabular-nums sm:text-3xl">
          {value}
        </p>
        {children && <div className="mt-4 border-t border-white/15 pt-4 text-sm text-white/70">{children}</div>}
      </div>
    </div>
  );
}
