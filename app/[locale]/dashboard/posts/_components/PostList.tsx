"use client";
import { useTranslations } from "next-intl"; // Import useTranslations
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/queries/posts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Post } from "@/types/posts";
import PostCard from "./PostCard";

interface PostListProps {
  page: number;
  setPage: (page: number) => void;
  search: string;
  isPublished?: boolean;
  ordering: string;
  onEdit: (post: Post) => void;
}

export function PostList({
  page,
  setPage,
  search,
  isPublished,
  ordering,
  onEdit,
}: PostListProps) {
  const t = useTranslations("PostList"); // Fetch translations

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", page, search, isPublished, ordering],
    queryFn: () =>
      fetchPosts({
        page,
        search: search || undefined,
        is_published: isPublished,
        ordering,
      }),
  });

  if (isLoading) {
    return (
      <>
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-64 w-full mb-6" />
          ))}
      </>
    );
  }

  if (isError) {
    return (
      <p className="text-red-500">
        {t("error", { message: (error as Error).message })}
      </p>
    );
  }

  if (!data || data.results.length === 0) {
    return <p className="text-gray-500">{t("noPosts")}</p>;
  }

  return (
    <>
      {data.results.map((post: Post) => (
        <PostCard key={post.id} post={post} onEdit={onEdit} />
      ))}
      {data.count > 10 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={!data.previous}
          >
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pageInfo", { page, total: Math.ceil(data.count / 10) })}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!data.next}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </>
  );
}

export default PostList;
