import Navigation from "@/components/Navigation";

// Skeleton of a typical app page, shown while data loads.
export default function PageLoader({ label }: { label: string }) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-cream text-ink">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-12" aria-busy="true">
          <p role="status" className="sr-only">
            {label}
          </p>
          <div className="skeleton h-56 rounded-[2rem] sm:h-64" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="space-y-4 rounded-[1.75rem] border border-line bg-white/60 p-6">
              <div className="skeleton h-5 w-40 rounded-full" />
              <div className="skeleton h-12 rounded-2xl" />
              <div className="skeleton h-12 rounded-2xl" />
              <div className="skeleton h-12 rounded-2xl" />
            </div>
            <div className="space-y-3 rounded-[1.75rem] border border-line bg-white/60 p-6">
              <div className="skeleton h-5 w-52 rounded-full" />
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-16 rounded-2xl" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
