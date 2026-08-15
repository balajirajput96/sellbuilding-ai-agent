import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div
      className="flex min-h-screen bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading your secure workspace"
    >
      <span className="sr-only">Loading your secure workspace.</span>
      {/* Sidebar skeleton */}
      <div className="relative hidden w-[280px] border-r border-border bg-background p-4 space-y-6 md:block">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Menu items */}
        <div className="space-y-2 px-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* User profile area at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        {/* Content blocks */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Loading your workspace</p>
          <p className="text-sm text-muted-foreground">Securing your session and preparing your tools.</p>
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
