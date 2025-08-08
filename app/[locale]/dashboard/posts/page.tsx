// app/dashboard/social-feed/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchPosts } from "@/queries/posts";
import { Post } from "@/types/posts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostCard } from "./_components/PostCard";
import CreateEditPostDialog from "./_components/CreateEditPost";
import CommentSection from "./_components/CommentsSection";

export default function SocialFeedPage() {
  const t = useTranslations("SocialFeed");
  const { canEdit } = useCurrentUser();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [ordering, setOrdering] = useState("-published_at");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const isPublished =
    activeTab === "published"
      ? true
      : activeTab === "drafts"
        ? false
        : undefined;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setExpandedPostId(null);
  }, [debouncedSearch, activeTab, ordering]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", page, debouncedSearch, isPublished, ordering],
    queryFn: () =>
      fetchPosts({
        page,
        search: debouncedSearch,
        is_published: isPublished,
        ordering,
      }),
    keepPreviousData: true,
  });

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setIsCreateDialogOpen(true);
  }, []);

  const handleCreateNew = () => {
    setEditingPost(null);
    setIsCreateDialogOpen(true);
  };

  const handleExpandToggle = useCallback((postId: number) => {
    setExpandedPostId((prev) => (prev === postId ? null : postId));
  }, []);

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setEditingPost(null);
    }
    setIsCreateDialogOpen(open);
  };

  return (
    <div className="w-full">
      <Card className="mb-6 border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {t("title")}
              </CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            {canEdit && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" /> {t("createPost")}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full lg:col-span-2"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
            <TabsTrigger value="published" disabled={!canEdit}>
              {t("tabs.published")}
            </TabsTrigger>
            <TabsTrigger value="drafts" disabled={!canEdit}>
              {t("tabs.drafts")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 justify-end items-center md:col-span-2 lg:col-span-1">
          <Select value={ordering} onValueChange={setOrdering}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t("sort.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-published_at">
                {t("sort.newestFirst")}
              </SelectItem>
              <SelectItem value="published_at">
                {t("sort.oldestFirst")}
              </SelectItem>
              <SelectItem value="-views_count">
                {t("sort.mostViewed")}
              </SelectItem>
              <SelectItem value="-likes_count">
                {t("sort.mostLiked")}
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="w-full md:w-64">
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t("error.title")}</h3>
          <p className="text-muted-foreground mb-4">
            {(error as Error).message}
          </p>
          <Button
            onClick={() => queryClient.refetchQueries({ queryKey: ["posts"] })}
          >
            {t("error.tryAgain")}
          </Button>
        </Card>
      ) : data?.results.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold mb-4">{t("noPosts.title")}</h3>
          <p className="text-muted-foreground mb-6">
            {t("noPosts.defaultMessage")}
          </p>
          {canEdit && (
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> {t("createPost")}
            </Button>
          )}
        </Card>
      ) : (
        <div>
          <AnimatePresence>
            {data?.results.map((post: Post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PostCard
                  post={post}
                  onEdit={handleEdit}
                  expanded={expandedPostId === post.id}
                  onExpandToggle={() => handleExpandToggle(post.id)}
                  canEdit={canEdit}
                />
                {expandedPostId === post.id && (
                  <CommentSection postId={post.id} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {data && data.count > 10 && (
            <div className="flex justify-between items-center mt-6 mb-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={!data.previous}
              >
                {t("pagination.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pagination.page", {
                  page,
                  total: Math.ceil(data.count / 10),
                })}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.next}
              >
                {t("pagination.next")}
              </Button>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <CreateEditPostDialog
          open={isCreateDialogOpen}
          onOpenChange={handleDialogChange}
          post={editingPost || undefined}
        />
      )}
    </div>
  );
}
