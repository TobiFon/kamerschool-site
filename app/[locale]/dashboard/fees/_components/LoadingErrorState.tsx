import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have this utility

interface LoadingErrorStateProps {
  isLoading?: boolean;
  error?: Error | string | null;
  spinnerSize?: "small" | "medium" | "large";
  message?: string; // Optional custom loading message
  className?: string; // Allow custom styling
}

const LoadingErrorState: React.FC<LoadingErrorStateProps> = ({
  isLoading = false,
  error = null,
  spinnerSize = "medium",
  message,
  className,
}) => {
  const spinnerSizes = {
    small: "h-5 w-5",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center text-center p-6 min-h-[150px]", // Added min-height
    className
  );

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <Loader2
          className={cn("animate-spin text-primary", spinnerSizes[spinnerSize])}
        />
        {message && (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    );
  }

  if (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : error instanceof Error
        ? error.message
        : "An unknown error occurred."; // Default error message

    return (
      <div className={cn(containerClasses, "text-destructive")}>
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm font-medium">Error</p>
        <p className="text-xs mt-1">{errorMessage}</p>
        {/* Optional: Add a retry button */}
        {/* <Button variant="outline" size="sm" className="mt-4">Retry</Button> */}
      </div>
    );
  }

  return null;
};

export default LoadingErrorState;
