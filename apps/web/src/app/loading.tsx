export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--bg-soft)]">
      {/* Header skeleton */}
      <div className="h-16 bg-[var(--bg)] border-b border-[var(--border)] flex items-center px-6 gap-4">
        <div className="w-8 h-8 bg-[var(--border)] rounded-lg animate-pulse" />
        <div className="flex-1 max-w-xl mx-auto">
          <div className="h-9 bg-[var(--border)] rounded-xl animate-pulse" />
        </div>
        <div className="w-20 h-8 bg-[var(--border)] rounded-lg animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="h-48 bg-[var(--border)] rounded-2xl animate-pulse mb-8" />

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[var(--border)] animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="aspect-square bg-[var(--border)]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[var(--border)] rounded w-2/3" />
                <div className="h-4 bg-[var(--border)] rounded w-full" />
                <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                <div className="h-5 bg-[var(--border)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
