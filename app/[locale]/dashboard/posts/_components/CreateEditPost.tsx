// app/dashboard/social-feed/_components/CreateEditPostDialog.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  updatePost,
  bulkCreateMedia,
  updatePostMedia,
} from "@/queries/posts";
import { Post } from "@/types/posts";
import { toast } from "sonner";
import Image from "next/image";
import {
  Plus,
  Trash2,
  UploadCloud,
  FileVideo,
  FileImage,
  X,
  Loader2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreateEditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: Post;
}

export function CreateEditPostDialog({
  open,
  onOpenChange,
  post,
}: CreateEditPostDialogProps) {
  const t = useTranslations("CreateEditPostDialog");
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setContent(post.content || "");
      // Note: We don't load existing media files for editing, user will replace them.
      setFiles([]);
      setPreviews([]);
    } else {
      // Reset form for creation
      setTitle("");
      setContent("");
      setFiles([]);
      setPreviews([]);
    }
  }, [post, open]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews(newPreviews);
    },
    [files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
  });

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setPreviews(previews.filter((_, index) => index !== indexToRemove));
  };

  const handleClose = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    onOpenChange(false);
  };

  const createPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: async (newPost) => {
      if (files.length > 0) {
        await bulkCreateMedia(newPost.id, files);
      }
      toast.success(t("toast.postCreated"));
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      handleClose();
    },
    onError: (error: Error) =>
      toast.error(t("toast.error", { message: error.message })),
  });

  const updatePostMutation = useMutation({
    mutationFn: (postData: { id: number; data: Partial<Post> }) =>
      updatePost(postData.id, postData.data),
    onSuccess: async (updatedPost) => {
      if (files.length > 0) {
        await updatePostMedia(updatedPost.id, files);
      }
      toast.success(t("toast.postUpdated"));
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      handleClose();
    },
    onError: (error: Error) =>
      toast.error(t("toast.error", { message: error.message })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (post) {
      // Editing
      updatePostMutation.mutate({ id: post.id, data: { title, content } });
    } else {
      // Creating
      createPostMutation.mutate({ title, content });
    }
  };

  const isPending =
    createPostMutation.isPending || updatePostMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{post ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {post ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">{t("titleLabel")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              disabled={isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">{t("contentLabel")}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("contentPlaceholder")}
              className="min-h-32"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("mediaLabel")}</Label>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 dark:border-gray-700 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center text-muted-foreground">
                <UploadCloud className="h-10 w-10 mb-2" />
                <p>{t("dragAndDrop")}</p>
                <p className="text-xs mt-1">{t("orClick")}</p>
              </div>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t("previews")}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden group"
                  >
                    {files[index].type.startsWith("image/") ? (
                      <Image
                        src={preview}
                        alt={`Preview ${index}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-gray-800 h-full flex items-center justify-center">
                        <FileVideo className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {post ? t("updatePost") : t("createPostAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateEditPostDialog;
