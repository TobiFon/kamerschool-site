"use client";
import { useTranslations } from "next-intl"; // Import useTranslations
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { ImageIcon, Video, Calendar } from "lucide-react";

interface CreatePostTriggerProps {
  onOpenDialog: () => void;
}

export function CreatePostTrigger({ onOpenDialog }: CreatePostTriggerProps) {
  const t = useTranslations("CreatePostTrigger"); // Fetch translations

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="/fallback.jpeg" alt="Profile" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Input
              placeholder={t("placeholder")}
              onClick={onOpenDialog}
              readOnly
              className="cursor-pointer bg-muted"
            />
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between pt-0">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={onOpenDialog}
        >
          <ImageIcon size={20} />
          <span>{t("photo")}</span>
        </Button>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={onOpenDialog}
        >
          <Video size={20} />
          <span>{t("video")}</span>
        </Button>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={onOpenDialog}
        >
          <Calendar size={20} />
          <span>{t("event")}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CreatePostTrigger;
