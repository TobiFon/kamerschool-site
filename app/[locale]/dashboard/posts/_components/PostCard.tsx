"use client";
import { useState } from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deletePost,
  publishPost,
  unpublishPost,
  trackPostView,
  likePost,
  unlikePost,
} from "@/queries/posts";
import { Post } from "@/types/posts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Send,
  Copy,
  Globe,
  AlertCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
} from "lucide-react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  expanded?: boolean;
  onExpandToggle?: () => void;
}

export function PostCard({
  post,
  onEdit,
  expanded = false,
  onExpandToggle,
}: PostCardProps) {
  const t = useTranslations("PostCard"); // Fetch translations
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(post.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [mediaExpanded, setMediaExpanded] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(t("toast.deleteSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("toast.deleteError", { message: error.message }));
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(t("toast.publishSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("toast.publishError", { message: error.message }));
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(t("toast.unpublishSuccess"));
    },
    onError: (error: Error) => {
      toast.error(t("toast.unpublishError", { message: error.message }));
    },
  });

  const trackViewMutation = useMutation({
    mutationFn: trackPostView,
    onSuccess: (data) => {
      queryClient.setQueryData(["posts"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((p: Post) =>
            p.id === post.id ? { ...p, views_count: data.views_count } : p
          ),
        };
      });
      toast.success(t("toast.shareSuccess"));
    },
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => (liked ? unlikePost(id) : likePost(id)),
    onSuccess: () => {
      setLiked(!liked);
      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    },
    onError: (error: Error) => {
      toast.error(
        t("toast.likeError", {
          action: liked ? "unlike" : "like",
          message: error.message,
        })
      );
    },
  });

  const handleDelete = () => {
    toast.promise(
      new Promise((resolve, reject) => {
        deleteMutation.mutate(post.id, {
          onSuccess: resolve,
          onError: reject,
        });
      }),
      {
        loading: t("toast.deleting"),
        success: t("toast.deleteSuccess"),
        error: t("toast.deleteFailed"),
      }
    );
  };

  const handlePublishToggle = () => {
    if (post.is_published) {
      unpublishMutation.mutate(post.id);
    } else {
      publishMutation.mutate(post.id);
    }
  };

  const handleLikeToggle = () => {
    likeMutation.mutate(post.id);
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      trackViewMutation.mutate(post.id);
    });
  };

  const truncateContent = (content: string, maxLength = 280) => {
    if (!content) return t("noContent");
    if (content.length <= maxLength || expanded) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    const visibleMedia = mediaExpanded ? post.media : post.media.slice(0, 4);

    if (post.media.length === 1) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          {post.media[0].media_type === "image" ? (
            <div className="relative w-full aspect-video">
              <Image
                src={`${post.media[0].file}`}
                alt={post.title || "Post image"}
                layout="fill"
                objectFit="cover"
                className="transition-transform hover:scale-105 duration-300"
              />
            </div>
          ) : (
            <video
              src={`${post.media[0].file}`}
              className="w-full object-cover rounded-lg"
              controls
              poster="/video-thumbnail.jpg"
            />
          )}
        </div>
      );
    }

    return (
      <div className="mt-4">
        <div
          className={`grid ${
            post.media.length === 2
              ? "grid-cols-2"
              : post.media.length >= 3
              ? "grid-cols-2"
              : "grid-cols-1"
          } gap-2`}
        >
          {visibleMedia.map((media, index) => (
            <div
              key={index}
              className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 ${
                index === 0 && post.media.length === 3 ? "row-span-2" : ""
              }`}
            >
              {media.media_type === "image" ? (
                <div className="aspect-video relative">
                  <Image
                    src={`${media.file}`}
                    alt={`${post.title || "Post"} image ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform hover:scale-105 duration-300"
                  />
                </div>
              ) : (
                <video
                  src={`${media.file}`}
                  className="w-full aspect-video object-cover"
                  controls
                  poster="/video-thumbnail.jpg"
                />
              )}
              {!mediaExpanded && index === 3 && post.media.length > 4 && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center text-white text-xl font-bold cursor-pointer"
                  onClick={() => setMediaExpanded(true)}
                >
                  +{post.media.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>

        {post.media.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-gray-500"
            onClick={() => setMediaExpanded(!mediaExpanded)}
          >
            {mediaExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" /> {t("showLess")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />{" "}
                {t("showAllMedia", { count: post.media.length })}
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  const formattedDate = post.published_at || post.created_at;
  const timeAgo = formatDistanceToNow(new Date(formattedDate), {
    addSuffix: true,
  });
  const exactDate = format(new Date(formattedDate), "PPP 'at' p");

  return (
    <Card className="mb-6 overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pt-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src="/fallback.jpeg" alt="Profile" />
              <AvatarFallback>
                {post.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium">
                  {post.title || t("untitled")}
                </h3>
                {!post.is_published && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800"
                  >
                    {t("draft")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center cursor-help">
                        <Calendar size={12} className="mr-1" />
                        {timeAgo}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{exactDate}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>•</span>
                <span className="flex items-center">
                  <Eye size={12} className="mr-1" />
                  {post.views_count || 0}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("postOptions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <Edit size={14} className="mr-2" /> {t("editPost")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePublishToggle}>
                {post.is_published ? (
                  <>
                    <AlertCircle size={14} className="mr-2" /> {t("unpublish")}
                  </>
                ) : (
                  <>
                    <FileCheck size={14} className="mr-2" /> {t("publish")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShare}>
                <Copy size={14} className="mr-2" /> {t("copyLink")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 size={14} className="mr-2" /> {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="whitespace-pre-line">
          {truncateContent(post.content || "")}
        </p>
        {!expanded && post.content && post.content.length > 280 && (
          <Button
            variant="link"
            className="p-0 h-auto mt-1 font-normal"
            onClick={onExpandToggle}
          >
            {t("readMore")}
          </Button>
        )}
        {renderMedia()}
      </CardContent>
      <CardFooter className="border-t py-3 flex flex-wrap justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLikeToggle}
            className={cn(
              "flex items-center gap-2 px-3",
              liked ? "text-rose-500" : "text-muted-foreground"
            )}
          >
            <Heart size={18} className={cn(liked && "fill-rose-500")} />
            <span>{likesCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpandToggle}
            className="flex items-center gap-2 text-muted-foreground px-3"
          >
            <MessageCircle size={18} />
            <span>{post.comments?.length || 0}</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info(t("toast.bookmarkComingSoon"))}
            className="text-muted-foreground"
          >
            <BookmarkPlus size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground"
          >
            <Share size={18} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default PostCard;
