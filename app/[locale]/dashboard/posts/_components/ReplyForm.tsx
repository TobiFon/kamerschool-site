// app/dashboard/social-feed/_components/ReplyForm.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isPending: boolean;
  canEdit: boolean;
}

export const ReplyForm = React.memo<ReplyFormProps>(
  ({ onSubmit, onCancel, isPending, canEdit }) => {
    const t = useTranslations("CommentSection");
    const [replyText, setReplyText] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      // Auto-focus the textarea when the reply form appears
      textAreaRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const content = replyText.trim();
      if (!content || !canEdit) return;
      onSubmit(content);
      setReplyText("");
    };

    return (
      <form onSubmit={handleSubmit} className="mt-3">
        <Textarea
          ref={textAreaRef}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={t("addReplyPlaceholder")}
          className="min-h-[60px] text-sm"
          disabled={!canEdit || isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t("cancelButton")}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!canEdit || !replyText.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("replyButton")
            )}
          </Button>
        </div>
      </form>
    );
  }
);
ReplyForm.displayName = "ReplyForm";
