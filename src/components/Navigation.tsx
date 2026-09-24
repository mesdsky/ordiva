"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";
import { featureIcons } from "@/components/landing/icons";
import { createClient } from "@/lib/supabase/client";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: featureIcons.dashboard },
  { label: "Transactions", href: "/transactions", icon: featureIcons.transactions },
  { label: "Budget", href: "/budget", icon: featureIcons.budget },
  { label: "Goals", href: "/goals", icon: featureIcons.goals },
  { label: "Subscriptions", href: "/subscriptions", icon: featureIcons.subscriptions },
  { label: "Debts", href: "/debts", icon: featureIcons.debts },
  { label: "Reports", href: "/reports", icon: featureIcons.reports },
];

// Mobile tab bar: the most used pages up front, the rest under "More".
const tabItems = ["/dashboard", "/transactions", "/budget"];
const moreItems = navigationItems.filter((item) => !tabItems.includes(item.href));

function Svg({ children, className = "h-[18px] w-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const userIcon = <path d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />;

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDirty, setDirty } = useUnsavedChanges();

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);

  // Slide the active pill under the current page's link.
  useLayoutEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      setPill(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  // Close menus on outside click or Escape.
  useEffect(() => {
    if (!profileMenuOpen && !moreOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen, moreOpen]);

  function closeMenus() {
    setProfileMenuOpen(false);
    setMoreOpen(false);
  }

  function navigateTo(href: string) {
    closeMenus();
    if (href === pathname) return;
    if (isDirty) {
      setPendingHref(href);
      setShowUnsavedModal(true);
      return;
    }
    router.push(href);
  }

  function stayOnPage() {
    setShowUnsavedModal(false);
    setPendingHref(null);
  }

  function leaveWithoutSaving() {
    const href = pendingHref;
    setShowUnsavedModal(false);
    setPendingHref(null);
    setDirty(false);
    if (href) router.push(href);
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      closeMenus();
      setDirty(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  const moreActive = moreItems.some((item) => item.href === pathname);

  return (
    <>
      {/* Navbar spacer */}
      <div className="h-[84px] shrink-0 sm:h-[96px]" aria-hidden="true" />

      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative flex h-[64px] items-center justify-between gap-3 rounded-full border border-white/70 bg-cream/75 px-2 shadow-[0_15px_45px_rgba(23,60,52,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl sm:h-[72px] sm:px-3">
            <button
              type="button"
              onClick={() => navigateTo("/dashboard")}
              className="group shrink-0 rounded-full px-2 transition duration-300 hover:bg-white/40"
              aria-label="Go to dashboard"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- original brand asset */}
              <img
                src="/ordiva-navbar.png"
                alt="Ordiva"
                width={2172}
                height={724}
                className="h-11 w-auto object-contain transition duration-300 group-hover:scale-[1.03] sm:h-14"
              />
            </button>

            {/* Desktop navigation */}
            <nav ref={desktopNavRef} aria-label="Main" className="relative hidden items-center gap-0.5 xl:flex">
              {pill && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-full rounded-full bg-white shadow-[inset_0_1px_0_white,0_6px_18px_rgba(33,79,67,0.10)] transition-[left,width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ left: pill.left, width: pill.width }}
                />
              )}
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                      isActive ? "text-forest" : "text-slate hover:text-forest"
                    }`}
                  >
                    <span
                      className={`transition-transform duration-300 [&_svg]:h-4 [&_svg]:w-4 ${
                        isActive ? "" : "group-hover:-translate-y-0.5"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo("/transactions")}
                className="group hidden items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(33,79,67,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-ink sm:flex"
              >
                <span className="text-base leading-none transition-transform duration-300 group-hover:rotate-90">+</span>
                Add
              </button>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen((current) => !current);
                    setMoreOpen(false);
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                    profileMenuOpen || ["/profile", "/settings", "/billing"].includes(pathname)
                      ? "border-mint bg-white text-forest shadow-[0_8px_25px_rgba(33,79,67,0.12)]"
                      : "border-white/80 bg-white/55 text-slate hover:bg-white hover:text-forest"
                  }`}
                  aria-label="Open account menu"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                >
                  <Svg className="h-5 w-5">{userIcon}</Svg>
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Account menu"
                    className="menu-pop absolute top-[calc(100%+12px)] right-0 w-[230px] origin-top-right rounded-[1.4rem] border border-white/80 bg-[#F9F8F2]/95 p-2 shadow-[0_20px_50px_rgba(23,60,52,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl"
                  >
                    <MenuItem
                      onClick={() => navigateTo("/profile")}
                      icon={<Svg>{userIcon}</Svg>}
                      title="Profile"
                      subtitle="Your account"
                    />
                    <MenuItem
                      onClick={() => navigateTo("/settings")}
                      icon={
                        <Svg>
                          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35A1.724 1.724 0 0 0 3.383 7.75c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066Z" />
                          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </Svg>
                      }
                      title="Settings"
                      subtitle="Preferences"
                    />
                    <MenuItem
                      onClick={() => navigateTo("/billing")}
                      icon={
                        <Svg>
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="M3 10h18M7 15h3" />
                        </Svg>
                      }
                      title="Billing"
                      subtitle="Plan & payments"
                    />
                    <div className="my-1.5 h-px bg-line" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#FDECEC] disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E4E1] text-[#7A4D43]">
                        {isLoggingOut ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Svg>
                            <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
                            <path d="M12 12h7.5m0 0-3-3m3 3-3 3" />
                          </Svg>
                        )}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[#7A4D43]">
                          {isLoggingOut ? "Logging out..." : "Log out"}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#9A7770]">Sign out of Ordiva</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile + tablet tab bar */}
      <nav
        aria-label="Main"
        className="app-tabbar fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] xl:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-between rounded-[1.75rem] border border-white/70 bg-cream/85 p-1.5 shadow-[0_-10px_40px_rgba(23,60,52,0.12),inset_0_1px_0_white] backdrop-blur-xl">
          {navigationItems
            .filter((item) => tabItems.includes(item.href))
            .slice(0, 2)
            .map((item) => (
              <TabButton key={item.href} item={item} active={pathname === item.href} onClick={() => navigateTo(item.href)} />
            ))}

          <button
            type="button"
            onClick={() => navigateTo("/transactions")}
            aria-label="Add transaction"
            className="-mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-cream bg-forest text-2xl text-white shadow-[0_12px_28px_rgba(33,79,67,0.35)] transition duration-300 active:scale-95"
          >
            +
          </button>

          {navigationItems
            .filter((item) => item.href === "/budget")
            .map((item) => (
              <TabButton key={item.href} item={item} active={pathname === item.href} onClick={() => navigateTo(item.href)} />
            ))}

          <button
            type="button"
            onClick={() => {
              setMoreOpen((open) => !open);
              setProfileMenuOpen(false);
            }}
            aria-expanded={moreOpen}
            aria-controls="more-sheet"
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-colors ${
              moreActive || moreOpen ? "bg-white text-forest" : "text-slate"
            }`}
          >
            <Svg>
              <circle cx="5" cy="12" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              <circle cx="19" cy="12" r="1.2" fill="currentColor" />
            </Svg>
            More
          </button>
        </div>
      </nav>

      {/* "More" sheet */}
      <div
        className={`fixed inset-0 z-40 bg-deep/30 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          moreOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMoreOpen(false)}
        aria-hidden="true"
      />
      <div
        id="more-sheet"
        className={`fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-[1.75rem] border border-white/80 bg-[#F9F8F2]/95 p-2 shadow-[0_24px_60px_rgba(23,60,52,0.2)] backdrop-blur-xl transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] xl:hidden ${
          moreOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">More pages</p>
        <div className="grid grid-cols-2 gap-1">
          {moreItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                type="button"
                tabIndex={moreOpen ? 0 : -1}
                onClick={() => navigateTo(item.href)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                  isActive ? "bg-mist text-forest" : "text-ink hover:bg-mist/70"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-forest [&_svg]:h-4 [&_svg]:w-4">
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={showUnsavedModal}
        title="Leave this page?"
        description="You still have unsaved changes. If you leave now, those changes will be lost."
        confirmLabel="Leave without saving"
        cancelLabel="Stay on page"
        onConfirm={leaveWithoutSaving}
        onCancel={stayOnPage}
      />
    </>
  );
}

function TabButton({
  item,
  active,
  onClick,
}: {
  item: (typeof navigationItems)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold transition-colors [&_svg]:h-[18px] [&_svg]:w-[18px] ${
        active ? "bg-white text-forest shadow-[0_4px_14px_rgba(33,79,67,0.08)]" : "text-slate"
      }`}
    >
      {item.icon}
      {item.label === "Transactions" ? "Activity" : item.label === "Dashboard" ? "Home" : item.label}
    </button>
  );
}

function MenuItem({
  onClick,
  icon,
  title,
  subtitle,
}: {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-mist/70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist text-forest transition-transform duration-300 group-hover:scale-105">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-forest">{title}</span>
        <span className="mt-0.5 block text-xs text-[#7A8A82]">{subtitle}</span>
      </span>
    </button>
  );
}
