export default function JobListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-gray-100" />
          <div className="p-2.5 space-y-1.5">
            <div className="h-2 w-1/3 bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-4/5 bg-gray-100 rounded" />
            <div className="h-3 w-2/3 bg-emerald-100/60 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
