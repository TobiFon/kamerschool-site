import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, School, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { deleteClass } from "@/queries/class";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const formatLevel = (level: string): string => {
  return level.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

interface HeaderProps {
  classData: any;
  onGoBack: () => void;
  schoolData?: any;
}

const Header: React.FC<HeaderProps> = ({ classData, onGoBack, schoolData }) => {
  const t = useTranslations("Classes");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { canEdit } = useCurrentUser();

  const handleEditClass = () =>
    router.push(`/dashboard/classes/${classData.id}/edit`);

  const handleDeleteClass = async () => {
    try {
      setIsDeleting(true);
      await deleteClass(classData.id);
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push("/dashboard/classes");
    } catch (error) {
      console.error("Failed to delete class:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="w-fit px-0 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToClasses")}
          </Button>

          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center">
              <div className="mr-4 h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                <School className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {classData.full_name}
                  </h1>
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/5 border-primary/10 text-primary"
                  >
                    {formatLevel(classData.level)}
                  </Badge>
                </div>
                <p className="text-gray-500 mt-1">
                  {t(classData.education_system?.name.toLowerCase())} •{" "}
                  {t("section")} {classData.section}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!canEdit}
                    variant="outline"
                    className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                    {t("deleteClass")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteClassConfirmation")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteClassWarning")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClass}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={isDeleting}
                    >
                      {isDeleting ? t("deleting") : t("deleteClass")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={handleEditClass}
                className="gap-2"
                disabled={!canEdit}
              >
                <Edit className="h-4 w-4" />
                {t("editClass")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
