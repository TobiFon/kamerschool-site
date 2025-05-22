// app/components/simple-loading-indicator.tsx
"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

export function SimpleLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Function to handle link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      // Check if it's an internal link
      if (
        link &&
        link.href &&
        link.href.startsWith(window.location.origin) &&
        !link.hasAttribute("download") &&
        !link.target
      ) {
        setIsLoading(true);
      }
    };

    // Function to handle when page content changes (navigation complete)
    const handleNavigationComplete = () => {
      setIsLoading(false);
    };

    // Listen for clicks
    document.addEventListener("click", handleLinkClick);

    // Create MutationObserver to detect when page content changes
    const observer = new MutationObserver(() => {
      if (isLoading) {
        handleNavigationComplete();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("click", handleLinkClick);
      observer.disconnect();
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <Progress value={undefined} className="h-1" />
    </div>
  );
}
