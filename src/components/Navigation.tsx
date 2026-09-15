"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useUnsavedChanges } from "@/components/UnsavedChangesProvider";
import { createClient } from "@/lib/supabase/client";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    active: true,
  },
  {
    label: "Transactions",
    href: "/transactions",
    active: true,
  },
  {
    label: "Budget",
    href: "/budget",
    active: true,
  },
  {
    label: "Goals",
    href: "/goals",
    active: true,
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    active: true,
  },
  {
    label: "Debts",
    href: "/debts",
    active: true,
  },
  {
    label: "Reports",
    href: "/reports",
    active: true,
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const { isDirty, setDirty } = useUnsavedChanges();

  const [showUnsavedModal, setShowUnsavedModal] =
    useState(false);

  const [pendingHref, setPendingHref] =
    useState<string | null>(null);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [pageMenuOpen, setPageMenuOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const profileMenuRef =
    useRef<HTMLDivElement>(null);

  const pageMenuRef =
    useRef<HTMLDivElement>(null);

  /*
   * Close open menus when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }

      if (
        pageMenuRef.current &&
        !pageMenuRef.current.contains(target)
      ) {
        setPageMenuOpen(false);
      }
    }

    if (profileMenuOpen || pageMenuOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [profileMenuOpen, pageMenuOpen]);

  /*
   * Close open menus with Escape
   */
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setPageMenuOpen(false);
      }
    }

    if (profileMenuOpen || pageMenuOpen) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [profileMenuOpen, pageMenuOpen]);

  function navigateTo(href: string) {
    if (href === pathname) {
      setProfileMenuOpen(false);
      setPageMenuOpen(false);
      return;
    }

    if (isDirty) {
      setPendingHref(href);
      setShowUnsavedModal(true);
      setProfileMenuOpen(false);
      setPageMenuOpen(false);
      return;
    }

    setProfileMenuOpen(false);
    setPageMenuOpen(false);
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

    if (href) {
      router.push(href);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      setProfileMenuOpen(false);
      setDirty(false);

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      {/* Navbar spacer */}
      <div
        className="h-[92px] shrink-0"
        aria-hidden="true"
      />

      {/* Fixed floating navigation */}
      <header className="fixed left-0 right-0 top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative flex min-h-[60px] items-center justify-between gap-1 overflow-visible rounded-[1.5rem] border border-white/70 bg-[#F5F2E8]/75 px-2 sm:min-h-[68px] sm:gap-3 sm:px-3 shadow-[0_15px_45px_rgba(23,60,52,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md md:px-5">

            {/* Glass highlight */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/90" />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -left-16 top-0 h-24 w-40 rounded-full bg-[#AFC1A4]/15 blur-3xl" />

            {/* Logo */}
            <button
              type="button"
              onClick={() =>
                navigateTo("/dashboard")
              }
              className="group relative z-10 shrink-0 rounded-2xl px-1 py-1 sm:px-2 transition duration-300 hover:bg-white/35"
              aria-label="Go to dashboard"
            >
              <img
                src="/ordiva-navbar.png"
                alt="Ordiva"
                className="h-12 w-auto object-contain sm:h-16 transition duration-300 group-hover:scale-[1.02]"
              />
            </button>

            {/* Desktop navigation */}
            <nav className="relative z-10 hidden items-center gap-1 xl:flex">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href;

                if (!item.active) {
                  return (
                    <span
                      key={item.label}
                      className="cursor-not-allowed rounded-xl px-3 py-2 text-sm font-medium text-[#A5B2AA]"
                      title={`${item.label} coming soon`}
                    >
                      {item.label}
                    </span>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      navigateTo(item.href)
                    }
                    className={`relative rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-white/65 text-[#214F43] shadow-[inset_0_1px_0_white,0_4px_15px_rgba(33,79,67,0.06)]"
                        : "text-[#5F7168] hover:bg-white/45 hover:text-[#214F43]"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#214F43]" />
                    )}

                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile + tablet page menu */}
            <div
              ref={pageMenuRef}
              className="relative z-[60] ml-auto shrink-0 xl:hidden"
            >
              <button
                type="button"
                onClick={() => {
                  setPageMenuOpen((current) => !current);
                  setProfileMenuOpen(false);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 sm:h-11 sm:w-11 ${
                  pageMenuOpen
                    ? "border-[#AFC1A4] bg-white/85 text-[#214F43] shadow-[0_8px_25px_rgba(33,79,67,0.12)]"
                    : "border-white/80 bg-white/55 text-[#5F7168] shadow-[0_4px_15px_rgba(33,79,67,0.05)] hover:bg-white/80 hover:text-[#214F43]"
                }`}
                aria-label="Open page navigation"
                aria-expanded={pageMenuOpen}
                aria-haspopup="menu"
                title="Page navigation"
              >
                <span className="relative flex h-4 w-5 flex-col justify-between">
                  <span
                    className={`h-0.5 w-5 origin-center rounded-full bg-current transition-transform duration-200 ${
                      pageMenuOpen ? "translate-y-[7px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-5 rounded-full bg-current transition-opacity duration-200 ${
                      pageMenuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-5 origin-center rounded-full bg-current transition-transform duration-200 ${
                      pageMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>

              {pageMenuOpen && (
                <div
                  role="menu"
                  aria-label="Page navigation"
                  className="absolute right-0 top-[calc(100%+12px)] w-[230px] origin-top-right rounded-[1.25rem] border border-white/80 bg-[#F9F8F2]/95 p-2 shadow-[0_20px_50px_rgba(23,60,52,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md"
                >
                  <p className="px-3 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7B9685]">
                    Navigate to
                  </p>

                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (!item.active) {
                      return (
                        <span
                          key={item.label}
                          role="menuitem"
                          aria-disabled="true"
                          className="block rounded-xl px-3 py-3 text-sm font-medium text-[#A5B2AA]"
                        >
                          {item.label}
                        </span>
                      );
                    }

                    return (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        onClick={() => navigateTo(item.href)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-[#E8EEDB] text-[#214F43]"
                            : "text-[#5F7168] hover:bg-[#E8EEDB]/70 hover:text-[#214F43]"
                        }`}
                      >
                        {item.label}
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#214F43]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div
              ref={profileMenuRef}
              className="relative z-[60] shrink-0"
            >
              {/* Profile icon */}
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(
                    (current) => !current
                  );
                  setPageMenuOpen(false);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 sm:h-11 sm:w-11 ${
                  profileMenuOpen
                    ? "border-[#AFC1A4] bg-white/85 text-[#214F43] shadow-[0_8px_25px_rgba(33,79,67,0.12)]"
                    : "border-white/80 bg-white/55 text-[#5F7168] shadow-[0_4px_15px_rgba(33,79,67,0.05)] hover:bg-white/80 hover:text-[#214F43] hover:shadow-[0_8px_22px_rgba(33,79,67,0.10)]"
                }`}
                aria-label="Open account menu"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                title="Account menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 top-[calc(100%+12px)] w-[220px] origin-top-right rounded-[1.25rem] border border-white/80 bg-[#F9F8F2]/95 p-2 shadow-[0_20px_50px_rgba(23,60,52,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md"
                >
                  {/* Profile */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      navigateTo("/profile")
                    }
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[#E8EEDB]/70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EEDB] text-[#214F43]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1-7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                        />
                      </svg>
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-[#214F43]">
                        Profile
                      </span>

                      <span className="mt-0.5 block text-xs text-[#7A8A82]">
                        Your account
                      </span>
                    </span>
                  </button>

                  {/* Settings */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      navigateTo("/settings")
                    }
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[#E8EEDB]/70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF0E7] text-[#5F7168]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35A1.724 1.724 0 0 0 3.383 7.75c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066Z"
                        />

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-[#214F43]">
                        Settings
                      </span>

                      <span className="mt-0.5 block text-xs text-[#7A8A82]">
                        Preferences
                      </span>
                    </span>
                  </button>

                  {/* Billing */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      navigateTo("/billing")
                    }
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[#E8EEDB]/70"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EEDB] text-[#214F43]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-[18px] w-[18px]"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
                        <path
                          strokeLinecap="round"
                          d="M3 10h18M7 15h3"
                        />
                      </svg>
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-[#214F43]">
                        Billing
                      </span>

                      <span className="mt-0.5 block text-xs text-[#7A8A82]">
                        Plan &amp; payments
                      </span>
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 h-px bg-[#DDE6D7]" />

                  {/* Logout */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 hover:bg-[#FDECEC] disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E4E1] text-[#7A4D43] transition-colors group-hover:bg-[#E8D7D7]">
                      {isLoggingOut ? (
                        <svg
                          className="h-[17px] w-[17px] animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="2"
                          />

                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M12 3a9 9 0 0 1 9 9h-2a7 7 0 0 0-7-7V3Z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-[18px] w-[18px]"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15"
                          />

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 12h7.5m0 0-3-3m3 3-3 3"
                          />
                        </svg>
                      )}
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-[#7A4D43]">
                        {isLoggingOut
                          ? "Logging out..."
                          : "Log out"}
                      </span>

                      <span className="mt-0.5 block text-xs text-[#9A7770]">
                        Sign out of Ordiva
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Unsaved changes confirmation */}
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