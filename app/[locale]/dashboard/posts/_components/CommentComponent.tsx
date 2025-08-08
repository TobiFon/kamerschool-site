// app/dashboard/social-feed/_components/CommentComponent.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  Reply,
  MoreVertical,
  PinIcon,
  Trash2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  unlikeComment,
  deleteComment,
  likeComment,
  pinComment,
  unpinComment,
} from "@/queries/posts";
import { Comment, CommentResponse } from "@/types/posts";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReplyForm } from "./ReplyForm";

interface CommentComponentProps {
  comment: Comment;
  postId: number;
  isReply?: boolean;
  activeReplyToId: number | null;
  onSetReplyTo: (id: number | null) => void;
  onAddReplySubmit: (parentId: number, textContent: string) => void;
  isCreateCommentPending: boolean;
  createCommentPendingVariables:
    | { parent?: number | null; content?: string; post?: number }
    | undefined;
}

export function CommentComponent({
  comment,
  postId,
  isReply = false,
  activeReplyToId,
  onSetReplyTo,
  onAddReplySubmit,
  isCreateCommentPending,
  createCommentPendingVariables,
}: CommentComponentProps) {
  const t = useTranslations("CommentSection.comment");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser();

  const mutationOptions = (options?: { onSuccess?: () => void }) => ({
    onSuccess: () => {
      options?.onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "An error occurred"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    ...mutationOptions({ onSuccess: () => toast.success(t("toast.deleted")) }),
  });
  const pinMutation = useMutation({
    mutationFn: pinComment,
    ...mutationOptions({ onSuccess: () => toast.success(t("toast.pinned")) }),
  });
  const unpinMutation = useMutation({
    mutationFn: unpinComment,
    ...mutationOptions({ onSuccess: () => toast.success(t("toast.unpinned")) }),
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (currentComment: Comment) => {
      return currentComment.user_has_liked
        ? unlikeComment(currentComment.id)
        : likeComment(currentComment.id);
    },
    onMutate: async (currentComment: Comment) => {
      const queryKey = ["comments", postId];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<CommentResponse>(queryKey);

      queryClient.setQueryData<CommentResponse>(queryKey, (oldData) => {
        if (!oldData) return oldData;

        const updateCommentRecursive = (comments: Comment[]): Comment[] => {
          return comments.map((c) => {
            if (c.id === currentComment.id) {
              return {
                ...c,
                user_has_liked: !c.user_has_liked,
                likes_count: c.user_has_liked
                  ? c.likes_count - 1
                  : c.likes_count + 1,
              };
            }
            if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateCommentRecursive(c.replies) };
            }
            return c;
          });
        };

        const updatedResults = updateCommentRecursive(oldData.results);
        return { ...oldData, results: updatedResults };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      toast.error("Failed to update like.");
      if (context?.previousData) {
        queryClient.setQueryData(["comments", postId], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const isReplying = activeReplyToId === comment.id;
  const isThisReplyPending =
    isCreateCommentPending &&
    createCommentPendingVariables?.parent === comment.id;

  return (
    <div className={cn("flex gap-3", isReply && "ml-8 sm:ml-12")}>
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src="/fallback.jpeg" />
        <AvatarFallback>{comment.user.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                {comment.user}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                •{" "}
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
              {comment.is_pinned && (
                <Badge variant="secondary" className="text-xs font-normal h-5">
                  <PinIcon className="h-3 w-3 mr-1" />
                  {t("pinnedBadge")}
                </Badge>
              )}
            </div>
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <MoreVertical size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() =>
                      comment.is_pinned
                        ? unpinMutation.mutate(comment.id)
                        : pinMutation.mutate(comment.id)
                    }
                  >
                    <PinIcon className="h-4 w-4 mr-2" />
                    {comment.is_pinned ? t("unpin") : t("pin")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => deleteMutation.mutate(comment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delete")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    {t("report")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs mt-1.5 text-gray-500 dark:text-gray-400">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-xs font-normal flex items-center gap-1 hover:text-red-500"
            onClick={() => canEdit && toggleLikeMutation.mutate(comment)}
            disabled={!canEdit || toggleLikeMutation.isPending}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                comment.user_has_liked && "fill-red-500 text-red-500"
              )}
            />
            <span>
              {comment.likes_count > 0 ? comment.likes_count : t("like")}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto text-xs font-normal flex items-center gap-1"
            onClick={() =>
              canEdit && onSetReplyTo(isReplying ? null : comment.id)
            }
            disabled={!canEdit}
          >
            <Reply className="h-3.5 w-3.5" /> {t("reply")}
          </Button>
        </div>
        {isReplying && (
          <ReplyForm
            onSubmit={(textContent) =>
              onAddReplySubmit(comment.id, textContent)
            }
            onCancel={() => onSetReplyTo(null)}
            isPending={isThisReplyPending}
            canEdit={canEdit}
          />
        )}

        {/* *** RECURSIVE RENDERING FIX *** */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {comment.replies.map((reply) => (
              <CommentComponent
                key={reply.id}
                postId={postId}
                comment={reply}
                isReply
                activeReplyToId={activeReplyToId}
                onSetReplyTo={onSetReplyTo}
                onAddReplySubmit={onAddReplySubmit}
                isCreateCommentPending={isCreateCommentPending}
                createCommentPendingVariables={createCommentPendingVariables}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
