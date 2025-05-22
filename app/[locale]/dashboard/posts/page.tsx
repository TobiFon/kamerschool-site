"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { Post } from "@/types/posts";
import dynamic from "next/dynamic";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/queries/posts";
import CreateEditPostDialog from "./_components/CreateEditPost";
import PostCard from "./_components/PostCard";

const CommentSection = dynamic(() => import("./_components/CommentsSection"), {
  loading: () => <div className="py-4 text-center">Loading comments...</div>,
  ssr: false,
});

export function SocialFeed() {
  const t = useTranslations("SocialFeed"); // Fetch translations for "SocialFeed" namespace
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [ordering, setOrdering] = useState("-created-at");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const isPublished =
    activeTab === "published"
      ? true
      : activeTab === "drafts"
      ? false
      : undefined;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab, ordering]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", page, debouncedSearch, isPublished, ordering],
    queryFn: () =>
      fetchPosts({
        page,
        search: debouncedSearch || undefined,
        is_published: isPublished,
        ordering,
      }),
    keepPreviousData: true,
  });

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setIsCreateDialogOpen(true);
  }, []);

  const handlePostClick = useCallback((postId: number) => {
    setExpandedPost((prev) => (prev === postId ? null : postId));
  }, []);

  return (
    <div className="w-full">
      <Card className="mb-6 border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" /> {t("createPost")}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Tabs
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
              <TabsTrigger value="published">{t("tabs.published")}</TabsTrigger>
              <TabsTrigger value="drafts">{t("tabs.drafts")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2 justify-end">
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
              className="w-full"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">{t("loading")}</p>
        </div>
      ) : isError ? (
        <Card className="p-8 flex flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t("error.title")}</h3>
          <p className="text-muted-foreground mb-4">
            {(error as Error).message}
          </p>
          <Button onClick={() => window.location.reload()}>
            {t("error.tryAgain")}
          </Button>
        </Card>
      ) : data?.results.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-semibold mb-4">{t("noPosts.title")}</h3>
          <p className="text-muted-foreground mb-6">
            {search
              ? t("noPosts.searchMessage")
              : activeTab === "drafts"
              ? t("noPosts.draftsMessage")
              : t("noPosts.defaultMessage")}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("createPost")}
          </Button>
        </Card>
      ) : (
        <AnimatePresence>
          {data?.results.map((post: Post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PostCard
                post={post}
                onEdit={handleEdit}
                expanded={expandedPost === post.id}
                onExpandToggle={() => handlePostClick(post.id)}
              />
              {expandedPost === post.id && <CommentSection postId={post.id} />}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {data && data.count > 10 && (
        <div className="flex justify-between items-center mt-6 mb-8">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={!data.previous || page === 1}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-sm px-4 py-2 rounded-md bg-background border">
            {t("pagination.page", { page, total: Math.ceil(data.count / 10) })}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!data.next}
          >
            {t("pagination.next")}
          </Button>
        </div>
      )}

      <CreateEditPostDialog
        open={isCreateDialogOpen || editingPost !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingPost(null);
          }
        }}
        post={editingPost}
      />
    </div>
  );
}

export default SocialFeed;
