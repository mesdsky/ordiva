"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Arrow } from "./icons";

const links = [
  { href: "#features", label: "Features" },
  { href: "#simulator", label: "Simulator" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // The bar stays put; it only turns more solid once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section in view.
  useEffect(() => {
    const sections = links
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px]">
        <div
          data-progress
          className="h-full origin-left scale-x-0 bg-gradient-to-r from-moss via-mint to-cream"
        />
      </div>

      <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border px-2.5 py-2 backdrop-blur-xl transition-all duration-500 sm:px-5 sm:py-2.5 ${
            scrolled
              ? "border-white/60 bg-cream/80 shadow-[0_12px_40px_rgba(23,60,52,0.12)]"
              : "border-white/40 bg-cream/55 shadow-[0_12px_40px_rgba(23,60,52,0.08)]"
          }`}
        >
          {/* ORIGINAL ORDIVA LOGO - DO NOT CHANGE */}
          <Link href="/" aria-label="Ordiva home" className="group flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- small brand mark, kept as the original asset */}
            <img
              src="/ordiva-navbar.png"
              alt="Ordiva"
              width={2172}
              height={724}
              className="h-10 w-auto object-contain transition duration-300 group-hover:scale-[1.03] sm:h-12"
            />
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-2 transition-colors hover:text-forest ${
                  active === link.href ? "text-forest" : "text-ink/75"
                }`}
              >
                {active === link.href && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-white/70 shadow-[inset_0_1px_0_white]" />
                )}
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-white/50 bg-white/30 px-4 py-2.5 text-sm font-semibold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition duration-300 hover:-translate-y-0.5 hover:bg-white/60 sm:inline-block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="group relative overflow-hidden rounded-full bg-forest px-4 py-2.5 text-xs font-semibold whitespace-nowrap text-white shadow-[0_10px_30px_rgba(33,79,67,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-ink sm:px-5 sm:text-sm"
            >
              <span className="relative flex items-center gap-2">
                Get Started
                <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/40 lg:hidden"
            >
              <span
                className={`absolute h-[1.5px] w-4 bg-ink transition-transform duration-300 ${
                  menuOpen ? "rotate-45" : "-translate-y-1"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-4 bg-ink transition-transform duration-300 ${
                  menuOpen ? "-rotate-45" : "translate-y-1"
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-cream/95 backdrop-blur-xl transition-[opacity,visibility] duration-500 lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex h-full flex-col justify-between px-6 pb-10 pt-32">
          <ul className="space-y-2">
            {links.map((link, index) => (
              <li
                key={link.href}
                className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  menuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
                style={{ transitionDelay: menuOpen ? `${80 + index * 60}ms` : "0ms" }}
              >
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline justify-between border-b border-line py-4 text-4xl font-semibold tracking-[-0.04em] text-ink"
                >
                  {link.label}
                  <span className="font-mono text-xs text-sage">0{index + 1}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="flex-1 rounded-full border border-line bg-white/60 py-4 text-center font-semibold text-ink"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 rounded-full bg-forest py-4 text-center font-semibold text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
