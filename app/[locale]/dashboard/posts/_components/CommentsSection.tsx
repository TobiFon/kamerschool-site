"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  Reply,
  MoreVertical,
  PinIcon,
  Trash2,
  Flag,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  unpinComment,
  fetchComments,
  createComment,
  deleteComment,
  unlikeComment,
  likeComment,
  pinComment,
} from "@/queries/posts";

interface Comment {
  id: number;
  user: string;
  content: string;
  is_pinned: boolean;
  parent: number | null;
  likes_count: number;
  user_has_liked?: boolean;
  replies: Comment[];
  created_at: string;
  updated_at: string;
}

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const t = useTranslations("CommentSection"); // Fetch translations
  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [page, setPage] = useState(1);
  const [allCommentsData, setAllCommentsData] = useState<Comment[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("CommentSection mounted with postId:", postId);
  }, [postId]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["comments", postId, page],
    queryFn: async () => {
      console.log(`Fetching comments for post ${postId}, page ${page}`);
      const result = await fetchComments({
        post: postId,
        ordering: "-created_at",
        page,
      });
      console.log("API response:", result);
      return result;
    },
    enabled: Boolean(postId),
    keepPreviousData: true,
    onSuccess: (newData) => {
      console.log("Query successful, data:", newData);
      if (page === 1) {
        setAllCommentsData(newData.results);
      } else {
        setAllCommentsData((prev) => [...prev, ...newData.results]);
      }
      setTimeout(
        () => console.log("allCommentsData after update:", allCommentsData),
        0
      );
    },
    onError: (error) => {
      console.error("Error fetching comments:", error);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setCommentContent("");
      setPage(1);
      toast.success(t("toast.commentAdded"));
    },
    onError: (error: any) => {
      toast.error(t("toast.addCommentError", { message: error.message }));
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success(t("toast.commentDeleted"));
    },
  });

  const toggleLikeCommentMutation = useMutation({
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) =>
      liked ? unlikeComment(id) : likeComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const togglePinCommentMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
      pinned ? unpinComment(id) : pinComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success(t("toast.pinUpdated"));
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    createCommentMutation.mutate({
      post: postId,
      content: commentContent,
    });
  };

  const handleAddReply = (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    createCommentMutation.mutate({
      post: postId,
      parent: parentId,
      content: replyContent,
    });
    setReplyTo(null);
    setReplyContent("");
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleToggleLike = (comment: Comment) => {
    toggleLikeCommentMutation.mutate({
      id: comment.id,
      liked: comment.user_has_liked || false,
    });
  };

  const handleTogglePin = (comment: Comment) => {
    togglePinCommentMutation.mutate({
      id: comment.id,
      pinned: comment.is_pinned,
    });
  };

  const handleLoadMore = () => {
    if (data?.next) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const toggleRepliesExpansion = (commentId: number) => {
    setExpandedReplies((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    );
  };

  const CommentComponent = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => {
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
      addSuffix: true,
    });

    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedReplies.includes(comment.id);

    return (
      <div className={`flex gap-3 mb-4 ${isReply ? "ml-12" : ""}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src="/avatar-placeholder.jpg" />
          <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.user}</span>
                {comment.is_pinned && (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal px-1 py-0 h-5"
                  >
                    <PinIcon className="h-3 w-3 mr-1" /> Pinned
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleTogglePin(comment)}>
                    <PinIcon className="h-4 w-4 mr-2" />
                    {comment.is_pinned ? t("comment.unpin") : t("comment.pin")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("comment.delete")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    {t("comment.report")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 text-xs mt-1 text-gray-500">
            <span>{timeAgo}</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-xs font-normal flex items-center"
              onClick={() => handleToggleLike(comment)}
            >
              <Heart
                className={cn(
                  "h-3 w-3 mr-1",
                  comment.user_has_liked ? "fill-red-500 text-red-500" : ""
                )}
              />
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
              {comment.likes_count === 0 && t("comment.like")}
            </Button>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-xs font-normal flex items-center"
                onClick={() =>
                  setReplyTo(replyTo === comment.id ? null : comment.id)
                }
              >
                <Reply className="h-3 w-3 mr-1" />
                {t("comment.reply")}
              </Button>
            )}

            {!isReply && hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-xs font-normal flex items-center"
                onClick={() => toggleRepliesExpansion(comment.id)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    {t("comment.hideReplies", {
                      count: comment.replies.length,
                    })}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    {t("comment.viewReplies", {
                      count: comment.replies.length,
                    })}
                  </>
                )}
              </Button>
            )}
          </div>

          {replyTo === comment.id && (
            <form
              onSubmit={(e) => handleAddReply(e, comment.id)}
              className="mt-2"
            >
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t("addCommentPlaceholder")}
                className="min-h-8 text-sm resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyTo(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !replyContent.trim() || createCommentMutation.isPending
                  }
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      {t("posting")}
                    </>
                  ) : (
                    t("comment.reply")
                  )}
                </Button>
              </div>
            </form>
          )}

          {!isReply && hasReplies && isExpanded && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading && page === 1) {
    return (
      <Card className="p-4 mt-2">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4 ml-12">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4 mt-2 text-center">
        <p className="text-red-500">{t("error")}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["comments", postId] })
          }
        >
          {t("retry")}
        </Button>
      </Card>
    );
  }

  const pinnedComments =
    data?.results.filter((comment: Comment) => comment.is_pinned) || [];
  const regularComments =
    data?.results.filter((comment: Comment) => !comment.is_pinned) || [];

  console.log("Pinned comments:", pinnedComments);
  console.log("Regular comments:", regularComments);

  return (
    <Card className="p-4 mt-2">
      <h3 className="font-medium text-lg mb-4">
        {t("commentsTitle", { count: data?.count || 0 })}
      </h3>

      <form onSubmit={handleAddComment} className="mb-6">
        <Textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder={t("addCommentPlaceholder")}
          className="resize-none mb-2"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!commentContent.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("posting")}
              </>
            ) : (
              t("postComment")
            )}
          </Button>
        </div>
      </form>

      {pinnedComments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">
            {t("pinnedComments")}
          </h4>
          {pinnedComments.map((comment: Comment) => (
            <CommentComponent key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {regularComments.map((comment: Comment) => (
        <CommentComponent key={comment.id} comment={comment} />
      ))}

      {!isLoading && allCommentsData.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>{t("noComments")}</p>
        </div>
      )}

      {data?.next && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                {t("loading")}
              </>
            ) : (
              t("loadMore")
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
