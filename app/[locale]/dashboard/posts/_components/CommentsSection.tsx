// app/dashboard/social-feed/_components/CommentsSection.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchComments, createComment } from "@/queries/posts";
import { Comment } from "@/types/posts";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentComponent } from "./CommentComponent";

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const t = useTranslations("CommentSection");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser();

  const [commentContent, setCommentContent] = useState("");
  const [page, setPage] = useState(1);
  const [activeReplyToId, setActiveReplyToId] = useState<number | null>(null);

  const queryKey = ["comments", postId, page];

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchComments({ post: postId, page }),
    keepPreviousData: true,
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      toast.success(t("toast.commentPosted"));
      setCommentContent("");
      setActiveReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // To update comment count
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toast.commentPostError"));
    },
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    const content = commentContent.trim();
    if (!content || !canEdit) return;
    createCommentMutation.mutate({ post: postId, content });
  };

  const handleAddReply = useCallback(
    (parentId: number, textContent: string) => {
      const content = textContent.trim();
      if (!content || !canEdit) return;
      createCommentMutation.mutate({ post: postId, parent: parentId, content });
    },
    [postId, createCommentMutation, canEdit]
  );

  if (isLoading && page === 1) {
    return (
      <Card className="p-4 mt-[-1rem] mb-6 border-t-0 rounded-t-none">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
          <div className="flex gap-3 ml-12">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4 mt-[-1rem] mb-6 border-t-0 rounded-t-none text-center text-destructive">
        {t("error")}
      </Card>
    );
  }

  const allComments = data?.results || [];

  return (
    <Card className="p-4 sm:p-6 mt-[-1rem] mb-6 border-t-0 rounded-t-none animate-fade-in">
      <h3 className="font-medium text-lg mb-4">
        {t("commentsTitle", { count: data?.count || 0 })}
      </h3>

      {canEdit && (
        <form onSubmit={handlePostComment} className="mb-6">
          <Textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder={t("addCommentPlaceholder")}
            className="mb-2"
            disabled={createCommentMutation.isPending}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                !commentContent.trim() || createCommentMutation.isPending
              }
            >
              {createCommentMutation.isPending &&
              !createCommentMutation.variables?.parent ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("postComment")}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {allComments.map((comment) => (
          <CommentComponent
            key={comment.id}
            postId={postId}
            comment={comment}
            activeReplyToId={activeReplyToId}
            onSetReplyTo={setActiveReplyToId}
            onAddReplySubmit={handleAddReply}
            isCreateCommentPending={createCommentMutation.isPending}
            createCommentPendingVariables={createCommentMutation.variables}
          />
        ))}
      </div>

      {!isLoading && allComments.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          {t("noComments")}
        </div>
      )}

      {data?.next && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("loadMore")
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
