"use client";
import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import {
  Plus,
  Loader2,
  EyeIcon,
  Edit,
  Trash2,
  Users,
  MoreHorizontal,
  Phone,
  Mail,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchTeachers, deleteTeacher } from "@/queries/teachers";
import PageHeader from "../_components/PageHeader";

// Define sort types for type safety
type SortField = "name" | "email" | "phone_number" | "created_at";
type SortDirection = "asc" | "desc";

const TeachersPage: React.FC = () => {
  const t = useTranslations("Teachers");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [teacherToDelete, setTeacherToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Add state for sorting
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Fetch teachers
  const { data, isLoading, error } = useQuery({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
  });

  // For debugging
  console.log("Raw data from API:", data);

  const handleViewTeacher = (teacherId: number): void => {
    router.push(`/dashboard/teachers/${teacherId}`);
  };

  const handleEditTeacher = (teacherId: number): void => {
    router.push(`/dashboard/teachers/${teacherId}/edit`);
  };

  const handleCreateTeacher = () => {
    router.push("/dashboard/teachers/create");
  };

  const handleDeleteClick = (teacherId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeacherToDelete(teacherId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      setIsDeleting(true);
      await deleteTeacher(teacherToDelete);

      // Invalidate and refetch queries after successful deletion
      await queryClient.invalidateQueries({ queryKey: ["teachers"] });

      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      console.error("Failed to delete teacher:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add sort handling function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get teachers array directly if the API doesn't return in the expected format
  const teachers = Array.isArray(data) ? data : data?.results || [];

  // Filter and sort teachers based on search query and sort state
  const filteredAndSortedTeachers = useMemo(() => {
    // First filter
    const filtered = teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.phone_number.includes(searchQuery)
    );

    // Then sort
    return [...filtered].sort((a, b) => {
      // Handle date field specially
      if (sortField === "created_at") {
        const dateA = new Date(a[sortField]).getTime();
        const dateB = new Date(b[sortField]).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle string fields
      const valueA = a[sortField].toLowerCase();
      const valueB = b[sortField].toLowerCase();

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [teachers, searchQuery, sortField, sortDirection]);

  // Helper for sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-40" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 text-primary" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 text-primary" />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <PageHeader title={t("teachersTitle") || "Teachers"} />
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 transition-colors"
          onClick={handleCreateTeacher}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createTeacher") || "Add Teacher"}
        </Button>
      </div>

      <Card className="mb-6 shadow-md border-0 overflow-hidden">
        <CardHeader className="pb-3 bg-gray-50">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" />
            {t("manageTeachers") || "Manage Teachers"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="flex w-full md:w-1/3">
              <Input
                placeholder={
                  t("searchTeachers") || "Search by name, email or phone..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          <div className="overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center p-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-16 text-red-500">
                <p className="text-lg font-medium">
                  {t("errorLoadingTeachers") || "Error loading teachers"}
                </p>
                <p className="text-sm mt-2">{String(error)}</p>
              </div>
            ) : filteredAndSortedTeachers.length === 0 ? (
              <div className="text-center p-16 text-gray-500">
                <div className="flex justify-center mb-4">
                  <Users className="h-12 w-12 text-gray-300" />
                </div>
                <p className="text-lg font-medium">
                  {searchQuery
                    ? t("noTeachersFound") ||
                      "No teachers found matching your search"
                    : t("noTeachersYet") || "No teachers added yet"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {t("addTeachersToGetStarted") ||
                    "Add teachers to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold w-10"></TableHead>
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="h-8 px-2 font-semibold flex items-center"
                      >
                        {t("teacherName") || "Name"}
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("email")}
                        className="h-8 px-2 font-semibold flex items-center"
                      >
                        {t("email") || "Email"}
                        {getSortIcon("email")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("phone_number")}
                        className="h-8 px-2 font-semibold flex items-center"
                      >
                        {t("phone") || "Phone"}
                        {getSortIcon("phone_number")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("created_at")}
                        className="h-8 px-2 font-semibold flex items-center"
                      >
                        {t("joinedDate") || "Joined"}
                        {getSortIcon("created_at")}
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-right w-16">
                      {t("actions") || "Actions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTeachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewTeacher(teacher.id)}
                    >
                      <TableCell className="w-10">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2 ring-offset-white">
                          {teacher.picture ? (
                            <AvatarImage
                              src={teacher.picture}
                              alt={teacher.name}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {teacher.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .substring(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{teacher.name}</div>
                        <div className="text-sm text-gray-500 md:hidden mt-1">
                          {teacher.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-600 hover:text-primary transition-colors">
                            {teacher.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">
                            {teacher.phone_number}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary/80 border-primary/10 font-normal"
                        >
                          {formatDate(teacher.created_at)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                {t("actions") || "Actions"}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTeacher(teacher.id);
                              }}
                              className="cursor-pointer"
                            >
                              <EyeIcon className="mr-2 h-4 w-4" />
                              {t("view") || "View"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTeacher(teacher.id);
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t("edit") || "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(teacher.id, e)}
                              className="text-red-600 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("delete") || "Delete"}
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteTeacherConfirmation") || "Delete Teacher"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteTeacherWarning") ||
                "Are you sure you want to delete this teacher? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeacherToDelete(null)}>
              {t("cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeacher}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting
                ? t("deleting") || "Deleting..."
                : t("deleteTeacher") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeachersPage;
