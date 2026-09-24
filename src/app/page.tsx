import Image from "next/image";
import Link from "next/link";
import Features from "@/components/landing/Features";
import HeroScene from "@/components/landing/HeroScene";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingEffects from "@/components/landing/LandingEffects";
import LandingNav from "@/components/landing/LandingNav";
import SavingsSimulator from "@/components/landing/SavingsSimulator";
import { Arrow, Check, Leaf } from "@/components/landing/icons";
import { CashFlowBars, CategoryLegend, DashboardStat, MONTHS, OverviewStat } from "@/components/landing/ui";

const HERO_IMAGE = "/ordiva-hero-bg.jpg";

export default function Home() {
  return (
    <main className="landing min-h-screen overflow-x-clip bg-cream text-ink">
      <noscript>
        <style>{`.landing [data-reveal]{opacity:1!important;transform:none!important}.landing [data-grow],.line-mask>span{transform:none!important}.donut{--sweep:100%!important}.scrub-word{opacity:1!important}`}</style>
      </noscript>
      <LandingEffects />
      <LandingNav />
      <Hero />
      <Marquee />
      <Manifesto />

      <section id="features" className="relative px-4 py-20 sm:px-6 sm:py-28 md:px-12 lg:px-16">
        <div className="pointer-events-none absolute top-20 -left-32 h-80 w-80 rounded-full bg-moss/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Everything you need"
            title={
              <>
                Manage your money
                <br />
                with <Serif>clarity.</Serif>
              </>
            }
            body="Everything you need to understand, organize, and grow your finances, all in one place."
          />
          <div className="mt-14">
            <Features />
          </div>
        </div>
      </section>

      <section id="simulator" className="relative px-4 py-20 sm:px-6 sm:py-28 md:px-12 lg:px-16">
        <div className="pointer-events-none absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-mist blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Try it now"
            title={
              <>
                How soon can you
                <br />
                reach your <Serif>goal?</Serif>
              </>
            }
            body="Pick a goal, move the sliders, and see for yourself. It runs right in your browser, no sign-up needed."
          />
          <div className="mt-14">
            <SavingsSimulator />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-clip bg-ink px-4 py-20 text-white sm:px-6 sm:py-28 md:px-12 lg:px-16">
        <Image src={HERO_IMAGE} alt="" fill sizes="100vw" className="object-cover opacity-[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/90 to-ink" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            dark
            eyebrow="How it works"
            title={
              <>
                Better money habits,
                <br />
                made <Serif>simple.</Serif>
              </>
            }
            body="From logging your first transaction to reaching your goals, every step is designed to feel simple."
          />
          <HowItWorks />
        </div>
      </section>

      <Overview />
      <Facts />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}

/* ========================================================= */

function Serif({ children }: { children: React.ReactNode }) {
  return <span className="font-serif font-normal tracking-[-0.01em] italic">{children}</span>;
}

function SectionHeading({
  eyebrow,
  title,
  body,
  dark = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  dark?: boolean;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
      <div>
        <p
          data-reveal
          className={`mb-4 flex items-center gap-3 text-xs font-semibold tracking-[0.25em] uppercase ${
            dark ? "text-moss" : "text-sage"
          }`}
        >
          <span className={`h-px w-8 ${dark ? "bg-moss" : "bg-sage"}`} />
          {eyebrow}
        </p>
        <h2
          data-reveal="clip"
          style={{ ["--d" as string]: "80ms" }}
          className={`text-4xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-5xl md:text-6xl ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      <p
        data-reveal
        style={{ ["--d" as string]: "160ms" }}
        className={`max-w-xl text-lg leading-8 ${dark ? "text-white/65" : "text-slate"}`}
      >
        {body}
      </p>
    </div>
  );
}

/* ========================================================= HERO */

function Hero() {
  return (
    <section data-tilt-area data-exit className="relative flex min-h-[100svh] items-center overflow-hidden bg-deep text-white">
      <div data-parallax="0.25" className="absolute -top-[10%] left-0 h-[120%] w-full">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-deep/95 via-ink/75 to-ink/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-deep via-transparent to-deep/30" />

      <div className="absolute inset-x-0 bottom-0 h-[70%] [mask-image:linear-gradient(to_top,black_40%,transparent)]">
        <HeroScene />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-4 pt-32 pb-24 sm:px-6 sm:pt-36 md:px-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:px-16">
        <div className="hero-copy max-w-2xl">
          <a
            href="#simulator"
            className="intro group mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 py-2 pr-4 pl-2 text-xs font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-colors hover:bg-white/15"
          >
            <span className="rounded-full bg-mint px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-deep uppercase">
              New
            </span>
            Goal simulator, try it below
            <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>

          <h1
            className="intro-lines text-[3.1rem] leading-[0.95] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[5.9rem]"
          >
            <span className="line-mask">
              <span style={{ ["--d" as string]: "100ms" }}>Plan Smarter.</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--d" as string]: "220ms" }} className="text-mint">
                Live <span className="font-serif font-normal tracking-[-0.02em] italic">Brighter.</span>
              </span>
            </span>
          </h1>

          <p
            style={{ ["--d" as string]: "450ms" }}
            className="intro mt-8 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8"
          >
            Manage your money in a simpler, tidier, more intentional way. Track your spending, build your goals,
            and make financial decisions with confidence.
          </p>

          <div style={{ ["--d" as string]: "560ms" }} className="intro mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              data-magnetic
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-cream px-7 py-4 text-sm font-semibold text-forest shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-colors duration-300 hover:bg-white"
            >
              <span className="absolute top-0 -left-20 h-full w-16 -skew-x-12 bg-white/70 transition-transform duration-700 group-hover:translate-x-[420px]" />
              <span className="relative">Get Started Free</span>
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-forest text-white transition-transform duration-300 group-hover:rotate-[-45deg]">
                <Arrow />
              </span>
            </Link>
            <a
              href="#features"
              className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:bg-white/20"
            >
              Explore Ordiva
              <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                <Arrow className="rotate-90" />
              </span>
            </a>
          </div>

          <ul style={{ ["--d" as string]: "680ms" }} className="intro mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/65">
            {["Free to start", "All-in-one finance", "Private by default"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/15 text-mint">
                  <Check />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard mock */}
        <div style={{ ["--d" as string]: "300ms" }} className="intro-scale intro-grow hero-mock relative">
          <div data-parallax="-0.06" className="absolute -top-8 -right-2 z-30 hidden sm:block">
            <div className="float rounded-2xl border border-white/30 bg-white/15 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-md">
              <p className="text-[10px] tracking-[0.18em] text-white/60 uppercase">Savings rate</p>
              <p className="mt-1 text-lg font-bold text-white tabular-nums">
                <span data-count="60" data-decimals="0">60</span>%
              </p>
            </div>
          </div>

          <div data-tilt="7" className="will-change-transform">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-white/15 p-2 shadow-[0_40px_120px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-md">
              <div className="overflow-hidden rounded-[1.55rem] border border-white/50 bg-cream/95 text-ink">
                <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">Overview</p>
                    <p className="mt-1 text-sm font-semibold">Good morning, Rani</p>
                  </div>
                  <div className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-forest shadow-sm">
                    September 2026
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
                  <DashboardStat label="Balance" count={8.24} dark />
                  <DashboardStat label="Income" count={5.4} />
                  <DashboardStat label="Expenses" count={2.16} />
                  <DashboardStat label="Savings" count={3.24} highlight />
                </div>

                <div className="grid gap-3 px-4 pb-4 sm:grid-cols-5 sm:px-5 sm:pb-5">
                  <div className="rounded-2xl border border-line bg-white/65 p-4 sm:col-span-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">Cash Flow</p>
                        <p className="mt-1 text-[10px] text-sage">Income vs expenses</p>
                      </div>
                      <span className="rounded-full bg-mist px-2.5 py-1 text-[9px] font-semibold text-forest">Monthly</span>
                    </div>
                    <CashFlowBars heights={[35, 52, 43, 66, 57, 74, 63, 87]} className="mt-6 h-28" />
                    <div className="mt-2 flex justify-between text-[9px] text-sage">
                      {MONTHS.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-mist p-4 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">Financial Goal</p>
                        <p className="mt-1 text-[10px] text-sage">Emergency Fund</p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest text-white">
                        <Leaf className="h-3.5 w-3.5 text-mint" />
                      </span>
                    </div>
                    <div className="mt-6 flex items-end justify-between">
                      <p className="text-2xl font-bold tabular-nums">
                        <span data-count="72" data-decimals="0">72</span>%
                      </p>
                      <p className="text-[10px] text-sage">Rp 7.2M / Rp 10M</p>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/70">
                      <div data-grow="x" style={{ ["--d" as string]: "400ms" }} className="h-full w-[72%] rounded-full bg-forest" />
                    </div>
                    <p className="mt-5 text-[10px] leading-4 text-slate">Keep going. You&apos;re getting closer.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-12 -left-10 z-30 hidden sm:block">
            <div className="float flex items-center gap-3 rounded-2xl border border-white/40 bg-cream/85 px-4 py-3 text-ink shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-md [animation-delay:-3s]">
              <span className="pulse-ring flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white">
                <Arrow className="-rotate-45" />
              </span>
              <div>
                <p className="text-[10px] text-sage">Monthly progress</p>
                <p className="text-sm font-bold text-forest">Looking good</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <a
        href="#features"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] font-semibold tracking-[0.25em] text-white/55 uppercase transition hover:text-white sm:flex"
      >
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="scroll-cue absolute inset-0 bg-mint" />
        </span>
      </a>
    </section>
  );
}

/* ========================================================= MARQUEE */

function Marquee() {
  const items = ["Dashboard", "Transactions", "Financial Goals", "Smart Budget", "Subscriptions", "Debt Tracker", "Reports", "Multi-currency"];
  const row = (hidden: boolean, outline: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <li key={item} className="flex items-center">
          <span
            className={`px-8 tracking-[-0.04em] whitespace-nowrap ${
              outline
                ? "text-outline text-3xl font-semibold sm:text-5xl"
                : `text-4xl sm:text-6xl ${index % 2 ? "font-serif text-sage italic" : "font-semibold text-ink"}`
            }`}
          >
            {item}
          </span>
          <Leaf className={`h-5 w-5 ${outline ? "text-mint" : "text-moss"}`} />
        </li>
      ))}
    </ul>
  );
  return (
    <section
      aria-label="Ordiva features"
      data-scrub
      className="marquee-wrap space-y-4 overflow-hidden border-y border-line bg-cream py-8 sm:py-10"
    >
      <div className="marquee-shift">
        <div className="marquee flex w-max" style={{ ["--speed" as string]: "55s" }}>
          {row(false, false)}
          {row(true, false)}
        </div>
      </div>
      <div aria-hidden="true" className="marquee-shift-reverse">
        <div className="marquee marquee-reverse flex w-max" style={{ ["--speed" as string]: "70s" }}>
          {row(true, true)}
          {row(true, true)}
        </div>
      </div>
    </section>
  );
}

/* ========================================================= MANIFESTO */

// *text* marks serif accents. Odd segments of the split are accented.
const manifestoWords = "Money feels *lighter* when you can see where it goes. Ordiva turns *every rupiah* into a calm, clear picture, so you always know what to do next."
  .split("*")
  .flatMap((segment, index) =>
    segment
      .split(" ")
      .filter(Boolean)
      .map((word) => ({ word, accent: index % 2 === 1 }))
  );

function Manifesto() {
  const words = manifestoWords;
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-36 md:px-12 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-8 flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-sage uppercase">
          <span className="h-px w-8 bg-sage" />
          Why Ordiva
        </p>
        <p
          data-scrub
          style={{ ["--n" as string]: words.length }}
          className="text-3xl leading-[1.15] font-semibold tracking-[-0.04em] text-ink sm:text-5xl lg:text-[4rem]"
        >
          {words.map(({ word, accent }, i) => (
            <span
              key={i}
              className={`scrub-word ${accent ? "font-serif font-normal text-forest italic" : ""}`}
              style={{ ["--i" as string]: i }}
            >
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ========================================================= OVERVIEW */

function Overview() {
  return (
    <section id="overview" className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 md:px-12 lg:px-16">
      <div className="pointer-events-none absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-moss/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
        <div>
          <p data-reveal className="mb-4 flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-sage uppercase">
            <span className="h-px w-8 bg-sage" />
            See the big picture
          </p>
          <h2 data-reveal="clip" style={{ ["--d" as string]: "80ms" }} className="text-4xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-5xl md:text-6xl">
            One dashboard.
            <br />
            Complete <Serif>clarity.</Serif>
          </h2>
          <p data-reveal style={{ ["--d" as string]: "160ms" }} className="mt-6 text-lg leading-8 text-slate">
            From your balance to your financial goals, Ordiva shows you what is happening with your money and what
            to do next.
          </p>
          <div data-reveal style={{ ["--d" as string]: "240ms" }}>
            <Link
              href="/register"
              data-magnetic
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(33,79,67,0.2)] transition-colors hover:bg-ink"
            >
              Try Ordiva Now
              <Arrow className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div data-tilt-area data-sp>
          {/* Measured element stays untransformed; only the child unfolds. */}
          <div className="sp-unfold">
            <div data-tilt="4" className="relative rounded-[2rem] border border-white/60 bg-white/40 p-2 shadow-[0_30px_90px_rgba(23,60,52,0.14),inset_0_1px_0_white] backdrop-blur-md">
              <div className="rounded-[1.55rem] border border-line bg-cream/90 p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">Dashboard Overview</p>
                    <h3 className="mt-1 text-base font-semibold">Your financial snapshot</h3>
                  </div>
                  <span className="hidden rounded-full bg-mist px-3 py-1.5 text-[10px] font-semibold text-forest sm:block">
                    September 2026
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <OverviewStat label="Total Balance" value="Rp 8.24M" note="+12.4%" dark />
                  <OverviewStat label="Income" value="Rp 5.40M" note="This month" />
                  <OverviewStat label="Expenses" value="Rp 2.16M" note="This month" />
                  <OverviewStat label="Savings" value="Rp 3.24M" note="60% rate" highlight />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-5">
                  <div data-observe className="rounded-2xl border border-line bg-white/70 p-5 lg:col-span-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">Cash Flow</h4>
                        <p className="mt-1 text-[10px] text-sage">Income and expenses over time</p>
                      </div>
                      <span className="rounded-full bg-mist px-2.5 py-1 text-[9px] font-semibold text-forest">Monthly</span>
                    </div>
                    <CashFlowBars heights={[42, 55, 48, 68, 57, 75, 64, 90]} className="mt-8 h-40" ratio={0.62} />
                    <div className="mt-2 flex justify-between text-[9px] text-sage">
                      {MONTHS.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div data-observe className="rounded-2xl border border-line bg-white/70 p-5 lg:col-span-2">
                    <h4 className="text-sm font-semibold">Spending by Category</h4>
                    <p className="mt-1 text-[10px] text-sage">Where your money goes</p>
                    <div className="mt-7 flex items-center gap-6">
                      <div className="relative h-28 w-28 shrink-0">
                        <div
                          className="donut absolute inset-0 rounded-full"
                          style={{
                            background:
                              "conic-gradient(#214F43 0 32%, #7B9685 32% 53%, #AFC1A4 53% 68%, #C8D8BE 68% 80%, #E8EEDB 80% 100%)",
                          }}
                        />
                        <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-cream">
                          <span className="text-[9px] text-sage">Spent</span>
                          <span className="text-xs font-bold text-forest">Rp 2.16M</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-[10px]">
                        <CategoryLegend label="Food" value="32%" dot="bg-forest" />
                        <CategoryLegend label="Bills" value="21%" dot="bg-sage" />
                        <CategoryLegend label="Transport" value="15%" dot="bg-moss" />
                        <CategoryLegend label="Shopping" value="12%" dot="bg-mint" />
                        <CategoryLegend label="Other" value="20%" dot="bg-mist" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================= FACTS */

function Facts() {
  const facts = [
    { value: 7, prefix: "", label: "Tools in one place", note: "From daily transactions to monthly reports." },
    { value: 7, prefix: "", label: "Currencies supported", note: "IDR, USD, SGD, MYR, EUR, GBP, JPY." },
    { value: 0, prefix: "Rp ", label: "To get started", note: "Core features are free. No credit card needed." },
    { value: 0, prefix: "", label: "Spreadsheets needed", note: "Everything is organized and calculated for you." },
  ];
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-28 md:px-12 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            data-reveal
            style={{ ["--d" as string]: `${index * 90}ms` }}
            className="group bg-cream p-7 transition-colors duration-500 hover:bg-mist sm:p-8"
          >
            <p className="text-6xl font-semibold tracking-[-0.05em] text-ink tabular-nums transition-transform duration-500 group-hover:-translate-y-1">
              {fact.prefix}
              <span data-count={fact.value}>{fact.value}</span>
            </p>
            <p className="mt-4 font-semibold text-forest">{fact.label}</p>
            <p className="mt-1 text-sm leading-6 text-slate">{fact.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========================================================= FAQ */

const faqs = [
  {
    q: "Is Ordiva free to use?",
    a: "Yes. All core features are free to use. The Free plan includes up to 3 financial goals, 5 budgets per month, 5 active subscriptions, and 5 active debts. You can log as many transactions as you need.",
  },
  {
    q: "Is my financial data private?",
    a: "Your data can only be accessed by your own account. Every record is protected at the database level, so other users cannot see or change it.",
  },
  {
    q: "Do I need to connect my bank account?",
    a: "No. You log transactions yourself, so you stay in full control of what goes into Ordiva.",
  },
  {
    q: "Which currencies can I use?",
    a: "Ordiva supports IDR, USD, SGD, MYR, EUR, GBP, and JPY. Pick your main currency during onboarding and change it anytime in settings.",
  },
  {
    q: "What is Ordiva Premium?",
    a: "Premium will add 12-month trends, deeper category analysis, and a financial health score. It is still being prepared, and every core feature stays available in the meantime.",
  },
];

function Faq() {
  return (
    <section id="faq" className="px-4 py-20 sm:px-6 sm:py-28 md:px-12 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p data-reveal className="mb-4 flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-sage uppercase">
            <span className="h-px w-8 bg-sage" />
            FAQ
          </p>
          <h2 data-reveal="clip" style={{ ["--d" as string]: "80ms" }} className="text-4xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-5xl">
            Questions,
            <br />
            <Serif>answered.</Serif>
          </h2>
          <p data-reveal style={{ ["--d" as string]: "160ms" }} className="mt-6 max-w-sm text-lg leading-8 text-slate">
            The things people ask most before getting started with Ordiva.
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {faqs.map((item, index) => (
            <details
              key={item.q}
              name="faq"
              data-reveal
              style={{ ["--d" as string]: `${index * 70}ms` }}
              className="faq group"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold tracking-[-0.02em] text-ink transition-colors hover:text-forest sm:text-xl">
                {item.q}
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white/60 transition-all duration-500 group-open:rotate-45 group-open:border-forest group-open:bg-forest group-open:text-white">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-base leading-7 text-slate">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================= FINAL CTA */

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 md:px-12 lg:px-16">
      <div data-sp className="sp-expand absolute inset-0 overflow-hidden">
        <div data-parallax="0.2" className="absolute -top-[15%] left-0 h-[130%] w-full">
          <Image src={HERO_IMAGE} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-ink/75" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div
          data-reveal="scale"
          className="overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 px-6 py-20 text-center shadow-[0_30px_90px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-md md:px-16 md:py-28"
        >
          <p className="mb-6 text-xs font-semibold tracking-[0.25em] text-mint uppercase">Start your journey</p>
          <h2 data-observe className="mx-auto max-w-4xl text-5xl leading-[0.98] font-semibold tracking-[-0.05em] text-white md:text-7xl">
            <span className="line-mask">
              <span>Take control</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--d" as string]: "120ms" }}>
                of your <span className="font-serif font-normal text-mint italic">money.</span>
              </span>
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-white/70">
            Build better money habits and start moving toward a brighter future.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              data-magnetic
              className="group inline-flex items-center gap-3 rounded-full bg-cream py-2 pr-2 pl-7 font-semibold text-forest shadow-[0_15px_40px_rgba(0,0,0,0.2)] transition-colors hover:bg-white"
            >
              Get Started Free
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-white transition-transform duration-500 group-hover:rotate-[-45deg]">
                <Arrow />
              </span>
            </Link>
            <a
              href="#simulator"
              className="rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition duration-300 hover:bg-white/20"
            >
              Try the simulator
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================= FOOTER */

function Footer() {
  const columns = [
    {
      title: "Product",
      links: [
        ["Features", "#features"],
        ["Simulator", "#simulator"],
        ["How it works", "#how-it-works"],
        ["Pricing", "/pricing"],
      ],
    },
    {
      title: "Account",
      links: [
        ["Login", "/login"],
        ["Create account", "/register"],
        ["Forgot password", "/forgot-password"],
      ],
    },
  ];
  return (
    <footer data-observe className="relative overflow-hidden border-t border-line bg-cream px-6 pt-16 md:px-12 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* ORIGINAL LOGO */}
            {/* eslint-disable-next-line @next/next/no-img-element -- original brand asset */}
            <img src="/ordiva-navbar.png" alt="Ordiva" width={2172} height={724} className="-ml-6 h-14 w-auto object-contain" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate">
              Plan Smarter. Live Brighter. A personal finance app to track, plan, and grow.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold tracking-[0.2em] text-sage uppercase">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="group relative text-sm text-ink transition-colors hover:text-forest">
                      {label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-forest transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line py-6 text-xs text-sage sm:flex-row sm:justify-between">
          <p>© 2026 Ordiva. All rights reserved.</p>
          <p>Plan Smarter. Live Brighter.</p>
        </div>
      </div>

      <p
        aria-hidden="true"
        data-parallax="-0.08"
        className="text-outline pointer-events-none -mb-[0.22em] text-center text-[27vw] leading-none font-semibold tracking-[-0.07em] select-none"
      >
        {"Ordiva".split("").map((letter, i) => (
          <span key={i} className="letter" style={{ ["--i" as string]: i }}>
            {letter}
          </span>
        ))}
      </p>
    </footer>
  );
}
