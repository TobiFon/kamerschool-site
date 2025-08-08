// src/lib/cloudinary-utils.ts

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface VideoTransformations {
  width?: number;
  height?: number;
  crop?:
    | "fill"
    | "fit"
    | "limit"
    | "mfit"
    | "pad"
    | "lpad"
    | "mpad"
    | "crop"
    | "thumb"
    | "scale"
    | "imagga_crop"
    | "imagga_scale";
  quality?: string | number; // e.g., "auto", "auto:good", 80
  format?: string; // e.g., "auto", "mp4", "webm"
  videoCodec?: string; // e.g., "auto", "h264", "vp9", "h265"
  // Add more transformations as needed: https://cloudinary.com/documentation/video_transformation_reference
}

interface ImageTransformations
  extends Omit<VideoTransformations, "videoCodec"> {
  // Image specific transformations can go here if needed
  aspectRatio?: string; // e.g., "16:9"
  gravity?: string; // e.g., "auto", "face"
  zoom?: string;
}

/**
 * Generates a Cloudinary video URL.
 * @param publicId The public ID of the video in Cloudinary (e.g., "KamerSchool/en/mockups/dashboard_optimized")
 * @param transformations Optional transformation parameters.
 * @returns The full Cloudinary video URL.
 */
export function getCloudinaryVideoUrl(
  publicId: string,
  transformations: VideoTransformations = {}
): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn("Cloudinary cloud name is not configured.");
    return ""; // Or a fallback local path if you prefer
  }

  const {
    width,
    height,
    crop = "limit", // Good default to avoid upscaling
    quality = "auto",
    format = "auto",
    videoCodec = "auto",
  } = transformations;

  let transformString = "";
  if (width) transformString += `w_${width},`;
  if (height) transformString += `h_${height},`;
  if (width || height) transformString += `c_${crop},`; // Apply crop only if dimensions are set

  transformString += `q_${quality},f_${format},vc_${videoCodec}`;

  // Remove trailing comma if any transform was added
  transformString = transformString.replace(/,$/, "");

  // Construct the URL, assuming your videos are in 'KamerSchool' folder, then locale folder
  // Example publicId: 'en/mockups/dashboard-clip' (without the .mp4 extension)
  // If you uploaded 'dashboard-clip.mp4' into 'KamerSchool/en/mockups/',
  // then publicId would be 'KamerSchool/en/mockups/dashboard-clip'

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformString}/${publicId}`;
}

/**
 * Generates a Cloudinary image URL (can also be a video poster).
 * @param publicId The public ID of the image/video in Cloudinary.
 * @param transformations Optional transformation parameters.
 * @returns The full Cloudinary image URL.
 */
export function getCloudinaryImageUrl(
  publicId: string, // e.g., KamerSchool/en/images/dashboard-poster
  transformations: ImageTransformations = {}
): string {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn("Cloudinary cloud name is not configured.");
    return "";
  }
  const {
    width,
    height,
    crop = "limit",
    quality = "auto",
    format = "auto", // Usually 'jpg' or 'png' for posters, or 'auto'
    aspectRatio,
    gravity,
    zoom,
  } = transformations;

  let transformString = "";
  if (width) transformString += `w_${width},`;
  if (height) transformString += `h_${height},`;
  if (width || height || aspectRatio) transformString += `c_${crop},`;
  if (aspectRatio) transformString += `ar_${aspectRatio},`;
  if (gravity) transformString += `g_${gravity},`;
  if (zoom) transformString += `z_${zoom},`;

  transformString += `q_${quality},f_${format}`;
  transformString = transformString.replace(/,$/, "");

  // If publicId is for a video and you want a poster from it:
  // e.g. publicId: 'KamerSchool/en/mockups/dashboard-clip'
  // To get a poster: `https://res.cloudinary.com/.../video/upload/w_800,f_jpg/KamerSchool/en/mockups/dashboard-clip.jpg`
  // Notice the resource_type is 'video' and the format extension '.jpg' is added at the end of publicId for posters.

  // This function assumes publicId refers to an image asset or a video asset from which to extract a frame.
  // If publicId is `KamerSchool/en/mockups/dashboard-clip` (a video) and format is 'jpg'
  // it will produce a poster URL.
  const resourceType =
    format === "auto" ||
    (["jpg", "png", "webp", "gif", "avif", "jxl"].includes(format) &&
      !publicId.match(/\.(mp4|webm|mov|avi|mkv)$/i)) // if publicId already looks like an image
      ? "image"
      : "video"; // if it's a video ID, or format suggests a video, use video resource type

  // A common way to get a poster from a video is to specify the format (e.g., .jpg)
  // and Cloudinary handles it.
  // If publicId = 'KamerSchool/en/mockups/dashboard-clip', then the final URL for poster would be
  // .../video/upload/w_800,q_auto,f_jpg/KamerSchool/en/mockups/dashboard-clip.jpg
  // We append .${format} if format is not auto and publicId doesn't have an extension

  let finalPublicId = publicId;
  if (
    format !== "auto" &&
    !publicId.endsWith(`.${format}`) &&
    resourceType === "video"
  ) {
    finalPublicId = `${publicId}.${format}`; // for video posters, e.g. video_id.jpg
  }

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${transformString}/${finalPublicId}`;
}
