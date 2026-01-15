export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="pt-20 pb-12 min-h-[100svh] bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
          <div className="h-16 w-3/4 mx-auto bg-white/20 rounded-xl" />
          <div className="h-8 w-1/2 mx-auto bg-white/20 rounded-lg" />
          <div className="h-32 w-full bg-white/30 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
