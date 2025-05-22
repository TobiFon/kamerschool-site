// src/components/home/PlaceholderImage.tsx
import React from "react";

interface PlaceholderImageProps {
  width?: string | number;
  height?: string | number;
  text?: string;
  className?: string;
}

const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
  width = "100%",
  height = 300,
  text = "App Mockup/Screenshot",
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg ${className}`}
      style={{ width, height }}
    >
      <span className="text-slate-500 dark:text-slate-400 text-sm md:text-base p-4 text-center">
        {text}
      </span>
    </div>
  );
};

export default PlaceholderImage;
