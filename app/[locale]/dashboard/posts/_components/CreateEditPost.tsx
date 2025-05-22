"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost, updatePost } from "@/queries/posts";
import { Post } from "@/types/posts";
import { toast } from "sonner";
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
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";

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
  const t = useTranslations("CreateEditPostDialog"); // Fetch translations
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (post) {
      setFormData({ title: post.title, content: post.content });
    } else {
      setFormData({ title: "", content: "" });
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [post]);

  const createMutation = useMutation({
    mutationFn: (data: { postData: Partial<Post>; files: File[] }) =>
      createPost(data.postData, data.files),
    onSuccess: (newPost) => {
      queryClient.setQueryData(["posts"], (oldData: any) => {
        if (!oldData) return { results: [newPost] };
        return {
          ...oldData,
          results: [newPost, ...oldData.results],
        };
      });

      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(t("toast.postCreated"));
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(t("toast.error", { message: error.message }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      id: number;
      postData: Partial<Post>;
      files: File[];
    }) => updatePost(data.id, data.postData, data.files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(t("toast.postUpdated"));
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(t("toast.error", { message: error.message }));
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      const urls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (post) {
      updateMutation.mutate({
        id: post.id,
        postData: formData,
        files: selectedFiles,
      });
    } else {
      createMutation.mutate({ postData: formData, files: selectedFiles });
    }
  };

  const renderMediaPreviews = () => {
    if (previewUrls.length === 0) return null;
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative h-32 rounded-md overflow-hidden">
            <Image
              src={url}
              alt={`Preview ${index}`}
              layout="fill"
              objectFit="cover"
            />
            <button
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
              onClick={() => {
                setPreviewUrls(previewUrls.filter((_, i) => i !== index));
                setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{post ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>
            {post ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t("titleLabel")}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={t("titlePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">{t("contentLabel")}</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder={t("contentPlaceholder")}
                className="min-h-32"
              />
            </div>
            {renderMediaPreviews()}
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 w-full"
              >
                <Plus size={16} />
                {t("addMedia")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? t("saving")
                : post
                ? t("updatePost")
                : t("post")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateEditPostDialog;
