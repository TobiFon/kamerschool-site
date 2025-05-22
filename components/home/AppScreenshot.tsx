// src/components/home/AppScreenshot.tsx
import React from "react";
import Image, { ImageProps } from "next/image";

interface AppScreenshotProps
  extends Omit<
    ImageProps,
    "layout" | "objectFit" | "objectPosition" | "fill" | "alt"
  > {
  src: string;
  altText: string;
  type: "desktop" | "mobile";
  className?: string;
  priority?: boolean;
  // Width and height are expected from parent (intrinsic dimensions of the image file)
  width: number;
  height: number;
}

const AppScreenshot: React.FC<AppScreenshotProps> = ({
  src,
  altText,
  type,
  className = "",
  priority = false,
  width,
  height,
  ...restImageProps
}) => {
  // Common styles for the image itself within the container
  const imageElementStyles = "object-cover w-full h-full";

  if (type === "desktop") {
    const desktopContainerStyles =
      "rounded-lg shadow-2xl border-2 border-slate-100/80 overflow-hidden";
    return (
      <div className={`${desktopContainerStyles} ${className}`}>
        <Image
          src={src}
          alt={altText}
          width={width}
          height={height}
          priority={priority}
          className={imageElementStyles}
          {...restImageProps}
        />
      </div>
    );
  }

  if (type === "mobile") {
    // Simplified mobile: just the image with shadow and rounded corners.
    // The parent div will handle the aspect ratio and sizing.
    const mobileContainerStyles =
      "rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"; // Adjusted rounding
    return (
      <div className={`${mobileContainerStyles} ${className}`}>
        <Image
          src={src}
          alt={altText}
          width={width}
          height={height}
          priority={priority}
          className={imageElementStyles}
          {...restImageProps}
        />
      </div>
    );
  }

  return null;
};

export default AppScreenshot;
