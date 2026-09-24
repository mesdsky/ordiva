"use client";

import { useEffect } from "react";

/*
  Wires up all scroll/pointer effects on the landing page via data attributes,
  so the sections themselves can stay server-rendered:

  data-reveal / data-observe  -> gets data-shown once it enters the viewport
  data-count="8.24"           -> counts up from 0 when shown (data-decimals)
  data-scrub                  -> sets --p (0..1) as it scrolls through view
  data-sp                     -> sets --sp (0..1) while it enters the viewport
  data-exit                   -> sets --x (0..1) while it scrolls out the top
  data-parallax="0.15"        -> drifts vertically with scroll
  data-tilt                   -> 3D tilt toward the pointer
  data-magnetic               -> follows the pointer slightly
  .spotlight                  -> --mx/--my track the pointer
  data-progress               -> page scroll progress bar
*/
export default function LandingEffects() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    // Reveal + count-up
    const countUp = (el: HTMLElement) => {
      const end = Number(el.dataset.count);
      const decimals = Number(el.dataset.decimals ?? 0);
      if (!Number.isFinite(end) || reduced) return;
      const format = (v: number) =>
        v.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      const duration = 1600;
      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = format(end * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.shown = "";
          if (el.dataset.count !== undefined) countUp(el);
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    document
      .querySelectorAll<HTMLElement>("[data-reveal],[data-observe],[data-count]")
      .forEach((el) => observer.observe(el));
    cleanups.push(() => observer.disconnect());

    // Scroll-linked: scrub, parallax, progress
    const scrubs = [...document.querySelectorAll<HTMLElement>("[data-scrub]")];
    const parallax = reduced
      ? []
      : [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const progress = document.querySelector<HTMLElement>("[data-progress]");
    // Enter/exit effects are purely decorative: skipped for reduced motion,
    // where the CSS fallbacks (--sp: 1, --x: 0) show the final state.
    const enters = reduced ? [] : [...document.querySelectorAll<HTMLElement>("[data-sp]")];
    const exits = reduced ? [] : [...document.querySelectorAll<HTMLElement>("[data-exit]")];
    const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const vh = window.innerHeight;

        for (const el of scrubs) {
          const rect = el.getBoundingClientRect();
          const p = (vh * 0.85 - rect.top) / (rect.height + vh * 0.25);
          el.style.setProperty("--p", String(clamp01(p)));
        }

        for (const el of enters) {
          const rect = el.getBoundingClientRect();
          // 0 when the top touches the bottom edge, 1 once it reaches 25% from the top.
          el.style.setProperty("--sp", clamp01((vh - rect.top) / (vh * 0.75)).toFixed(3));
        }

        for (const el of exits) {
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--x", clamp01(-rect.top / rect.height).toFixed(3));
        }

        for (const el of parallax) {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < -200 || rect.top > vh + 200) continue;
          const offset = (rect.top + rect.height / 2 - vh / 2) * Number(el.dataset.parallax);
          el.style.translate = `0 ${(-offset).toFixed(1)}px`;
        }

        if (progress) {
          const max = document.documentElement.scrollHeight - vh;
          progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    });

    // Pointer: spotlight, tilt, magnetic (mouse/trackpad only)
    if (finePointer && !reduced) {
      const onPointerMove = (event: PointerEvent) => {
        const target = event.target as Element | null;
        const spot = target?.closest<HTMLElement>(".spotlight");
        if (spot) {
          const rect = spot.getBoundingClientRect();
          spot.style.setProperty("--mx", `${event.clientX - rect.left}px`);
          spot.style.setProperty("--my", `${event.clientY - rect.top}px`);
        }
      };
      document.addEventListener("pointermove", onPointerMove, { passive: true });
      cleanups.push(() => document.removeEventListener("pointermove", onPointerMove));

      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        const area = el.closest<HTMLElement>("[data-tilt-area]") ?? el;
        const strength = Number(el.dataset.tilt || 8);
        const move = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          el.style.transform = `perspective(1400px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg)`;
        };
        const leave = () => {
          el.style.transform = "";
        };
        el.style.transition = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        area.addEventListener("pointermove", move);
        area.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          area.removeEventListener("pointermove", move);
          area.removeEventListener("pointerleave", leave);
        });
      });

      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const move = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          el.style.translate = `${(x * 0.25).toFixed(1)}px ${(y * 0.35).toFixed(1)}px`;
        };
        const leave = () => {
          el.style.translate = "";
        };
        el.style.transition = "translate 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
