import { Skeleton } from "@/components/ui/skeleton";

export const MetricsGridSkeleton = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
};

export const PerformanceOverviewSkeleton = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = ({ height = "sm" }) => {
  const heightClass =
    {
      sm: "h-64",
      md: "h-80",
      lg: "h-96",
    }[height] || "h-64";

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${heightClass}`}>
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-4/6 mb-6" />
      <Skeleton className="h-32 w-full mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

const AnnouncementsSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-b pb-3">
            <Skeleton className="h-5 w-5/6 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/6 mb-2" />
            <div className="flex justify-between mt-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CalendarSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-7 gap-1 mb-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
};
