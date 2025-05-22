"use client";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import {
  Plus,
  Loader2,
  EyeIcon,
  Edit,
  Trash2,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchClasses, deleteClass } from "@/queries/class";
import { ClassesResponse } from "@/types/class";
import PageHeader from "../_components/PageHeader";

const ClassesPage: React.FC = () => {
  const t = useTranslations("Classes");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [classToDelete, setClassToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // fetch classes based on the selected education system
  const { data, isLoading, error } = useQuery<ClassesResponse>({
    queryKey: ["classes", selectedTab],
    queryFn: () =>
      fetchClasses({
        education_system: selectedTab !== "all" ? selectedTab : undefined,
      }),
  });

  const handleViewClass = (classId: number): void => {
    router.push(`/dashboard/classes/${classId}`);
  };

  const handleEditClass = (classId: number): void => {
    router.push(`/dashboard/classes/${classId}/edit`);
  };

  const handleCreateClass = () => {
    router.push("/dashboard/classes/create");
  };

  const handleDeleteClick = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(classId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      setIsDeleting(true);
      await deleteClass(classToDelete);

      // Invalidate and refetch queries after successful deletion
      await queryClient.invalidateQueries({ queryKey: ["classes"] });

      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    } catch (error) {
      console.error("Failed to delete class:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const classes = data || [];

  // Function to get appropriate badge color based on education system
  const getBadgeClass = (educationSystem: string): string => {
    if (educationSystem.includes("english_general")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    } else if (educationSystem.includes("english_technical")) {
      return "bg-green-50 text-green-700 border-green-200";
    } else if (educationSystem.includes("french_general")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    } else if (educationSystem.includes("french_technical")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <PageHeader title={t("classesTitle")} />
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 transition-colors"
          onClick={handleCreateClass}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createClass")}
        </Button>
      </div>

      <Card className="mb-6 shadow-md border-0">
        <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2 text-primary" />
            {t("manageClasses")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <TabsList className="grid w-full sm:w-fit grid-cols-5 bg-gray-100">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {t("allClasses")}
                </TabsTrigger>
                <TabsTrigger
                  value="en_gen"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {t("englishGeneral")}
                </TabsTrigger>
                <TabsTrigger
                  value="en_tech"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {t("englishTechnical")}
                </TabsTrigger>
                <TabsTrigger
                  value="fr_gen"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {t("frenchGeneral")}
                </TabsTrigger>
                <TabsTrigger
                  value="fr_tech"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {t("frenchTechnical")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="rounded-md overflow-hidden border bg-white">
              {isLoading ? (
                <div className="flex justify-center items-center p-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center p-16 text-red-500">
                  <p className="text-lg font-medium">
                    {t("errorLoadingClasses")}
                  </p>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center p-16 text-gray-500">
                  <div className="flex justify-center mb-4">
                    <GraduationCap className="h-12 w-12 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium">{t("noClassesFound")}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedTab === "all"
                      ? t("noClassesCreatedYet")
                      : t("noClassesInSystem", { system: t(selectedTab) })}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">
                        {t("className")}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t("system")}
                      </TableHead>
                      <TableHead className="font-semibold">
                        {t("level")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell font-semibold">
                        {t("stream")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell font-semibold">
                        {t("section")}
                      </TableHead>
                      <TableHead className="text-right font-semibold w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((classItem) => (
                      <TableRow
                        key={classItem.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewClass(classItem.id)}
                      >
                        <TableCell className="font-medium">
                          {classItem.full_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getBadgeClass(
                              classItem.education_system.name
                            )}
                          >
                            {t(classItem.education_system.name)}
                          </Badge>
                        </TableCell>
                        <TableCell>{classItem.level}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {classItem.stream || t("notApplicable")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {classItem.section || t("notApplicable")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t("actions")}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewClass(classItem.id);
                                }}
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                {t("view")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClass(classItem.id);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t("edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleDeleteClick(classItem.id, e)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteClassConfirmation")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteClassWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClassToDelete(null)}>
              {t("cancel")}
            </AlertDialogCancel>
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
    </div>
  );
};

export default ClassesPage;
