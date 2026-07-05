import { cn } from '@/lib/utils';

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded-md',
        className
      )}
    />
  );
}

export function CardShimmer({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4', className)}>
      <Shimmer className="w-1/3 h-5" />
      <Shimmer className="w-2/3 h-8" />
      <Shimmer className="w-1/2 h-4" />
    </div>
  );
}

export function TableShimmer({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex bg-gray-50 border-b border-gray-200 p-4 gap-4">
        <Shimmer className="w-1/4 h-5" />
        <Shimmer className="w-1/4 h-5" />
        <Shimmer className="w-1/4 h-5" />
        <Shimmer className="w-1/4 h-5" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex p-4 gap-4 border-b border-gray-100 last:border-0">
          <Shimmer className="w-1/4 h-4" />
          <Shimmer className="w-1/4 h-4" />
          <Shimmer className="w-1/4 h-4" />
          <Shimmer className="w-1/4 h-4" />
        </div>
      ))}
    </div>
  );
}
