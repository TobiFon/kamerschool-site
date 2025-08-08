// app/dashboard/social-feed/_components/PostCard.tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deletePost,
  publishPost,
  unpublishPost,
  trackPostView,
  likePost,
  unlikePost,
} from "@/queries/posts";
import { Post, Media } from "@/types/posts";
import { toast } from "sonner";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  expanded?: boolean;
  onExpandToggle?: () => void;
  canEdit: boolean;
}

const MediaGrid = ({ media, title }: { media: Media[]; title: string }) => {
  if (!media || media.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg overflow-hidden border">
      <div
        className={cn(
          "grid gap-1",
          media.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}
      >
        {media.slice(0, 4).map((m, index) => (
          <div
            key={m.id}
            className={cn(
              "relative aspect-video bg-gray-100 dark:bg-gray-800",
              media.length === 3 && index === 0 && "row-span-2"
            )}
          >
            <Image
              src={m.thumbnail || m.processed_file || m.file}
              alt={`${title} - media ${index + 1}`}
              fill
              className="object-cover"
            />
            {!m.is_processed && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs mt-2">Processing</span>
              </div>
            )}
            {m.media_type === "video" && m.is_processed && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <PlayCircle className="h-12 w-12 text-white/80" />
              </div>
            )}
            {media.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-bold text-2xl">
                +{media.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export function PostCard({
  post,
  onEdit,
  expanded = false,
  onExpandToggle,
  canEdit,
}: PostCardProps) {
  const t = useTranslations("PostCard");
  const queryClient = useQueryClient();

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "An error occurred");
    },
  };

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    ...mutationOptions,
    onSuccess: () => {
      toast.success(t("toast.deleteSuccess"));
      mutationOptions.onSuccess();
    },
  });
  const publishMutation = useMutation({
    mutationFn: publishPost,
    ...mutationOptions,
    onSuccess: () => {
      toast.success(t("toast.publishSuccess"));
      mutationOptions.onSuccess();
    },
  });
  const unpublishMutation = useMutation({
    mutationFn: unpublishPost,
    ...mutationOptions,
    onSuccess: () => {
      toast.success(t("toast.unpublishSuccess"));
      mutationOptions.onSuccess();
    },
  });
  const likeMutation = useMutation({
    mutationFn: (id: number) =>
      post.user_has_liked ? unlikePost(id) : likePost(id),
    ...mutationOptions,
  });
  const trackViewMutation = useMutation({
    mutationFn: trackPostView,
    ...mutationOptions,
  });

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`; // Assuming a public post URL structure
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success(t("toast.shareSuccess"));
      trackViewMutation.mutate(post.id);
    });
  };

  const truncateContent = (content: string, maxLength = 350) => {
    if (!content) return t("noContent");
    if (content.length <= maxLength || expanded) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  const timeAgo = formatDistanceToNow(
    new Date(post.published_at || post.created_at),
    { addSuffix: true }
  );
  const exactDate = format(
    new Date(post.published_at || post.created_at),
    "PPP 'at' p"
  );

  return (
    <Card className="mb-6 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20">
      <CardHeader className="pt-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 border-2 border-primary/10">
              <AvatarImage src="/fallback.jpeg" />
              <AvatarFallback>{post.author?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                {post.title || t("untitled")}
              </h3>
              <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                <span>{post.author}</span>
                <span>•</span>
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
              </div>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("postOptions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onEdit(post)}>
                  <Edit size={14} className="mr-2" /> {t("editPost")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    post.is_published
                      ? unpublishMutation.mutate(post.id)
                      : publishMutation.mutate(post.id)
                  }
                >
                  {post.is_published ? (
                    <>
                      <AlertCircle size={14} className="mr-2" />{" "}
                      {t("unpublish")}
                    </>
                  ) : (
                    <>
                      <FileCheck size={14} className="mr-2" /> {t("publish")}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleShare}>
                  <Copy size={14} className="mr-2" /> {t("copyLink")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => deleteMutation.mutate(post.id)}
                >
                  <Trash2 size={14} className="mr-2" /> {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        {!post.is_published && (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 mb-2"
          >
            {t("draft")}
          </Badge>
        )}
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
          {truncateContent(post.content || "")}
        </p>
        {!expanded && post.content && post.content.length > 350 && (
          <Button
            variant="link"
            className="p-0 h-auto mt-1 font-normal text-primary"
            onClick={onExpandToggle}
          >
            {t("readMore")}
          </Button>
        )}
        <MediaGrid media={post.media} title={post.title} />
      </CardContent>
      <CardFooter className="border-t bg-gray-50/50 dark:bg-gray-900/20 py-2 px-4 flex items-center justify-between text-muted-foreground">
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => canEdit && likeMutation.mutate(post.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2",
                    post.user_has_liked && "text-rose-500"
                  )}
                  disabled={!canEdit}
                >
                  <Heart
                    size={16}
                    className={cn(post.user_has_liked && "fill-rose-500")}
                  />
                  <span className="text-xs">{post.likes_count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("likeTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExpandToggle}
                  className="flex items-center gap-1.5 px-2"
                >
                  <MessageCircle size={16} />
                  <span className="text-xs">{post.comments_count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("commentTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs">
                <Eye size={16} />
                <span>{post.views_count}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("viewTooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

export default PostCard;
