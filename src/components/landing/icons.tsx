import type { ReactNode } from "react";

function Icon({ children, size = 20, className = "" }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <Icon size={14} className={className}>
      <path d="M4 12h16m0 0-6-6m6 6-6 6" />
    </Icon>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <Icon size={14} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export const featureIcons = {
  dashboard: (
    <Icon>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
    </Icon>
  ),
  transactions: (
    <Icon>
      <path d="M7 4v16m0 0-3.5-3.5M7 20l3.5-3.5M17 20V4m0 0-3.5 3.5M17 4l3.5 3.5" />
    </Icon>
  ),
  goals: (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </Icon>
  ),
  budget: (
    <Icon>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12V3.5Z" />
      <path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15V3.8Z" />
    </Icon>
  ),
  subscriptions: (
    <Icon>
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
    </Icon>
  ),
  debts: (
    <Icon>
      <path d="M4 7h16M4 12h11M4 17h6" />
      <path d="m16 15 2.5 2.5L21 15" />
    </Icon>
  ),
  reports: (
    <Icon>
      <path d="M4 19.5h16" />
      <path d="M5 15l4.5-4.5 3.5 3L19.5 7" />
      <path d="M15.5 7h4v4" />
    </Icon>
  ),
};

// Small leaf mark echoing the logo, used as a separator.
export function Leaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className={className}>
      <path d="M3 17C3 8 9 3 17 3c0 8-5 14-14 14Z" fill="currentColor" />
    </svg>
  );
}
