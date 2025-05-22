"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import {
  Plus,
  MoreHorizontal,
  Megaphone,
  RefreshCw,
  Filter,
  X,
  Search,
  Clock,
  AlertTriangle,
  Users,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import PageHeader from "../_components/PageHeader";
import { formatDate, cn } from "@/lib/utils";
import { Announcement } from "@/types/announcments";
import { fetchAnnouncements } from "@/queries/announcments";

// Type definition for the response from the API
interface AnnouncementResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Announcement[];
}

const AnnouncementsPage: React.FC = () => {
  const t = useTranslations("Announcements");
  const router = useRouter();
  const queryClient = useQueryClient();

  // States for filters and pagination
  const [target, setTarget] = useState<string>("all");
  const [isUrgent, setIsUrgent] = useState<string>("all");
  const [sort, setSort] = useState<string>("created_at_desc"); // Default to newest first
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [createdAfter, setCreatedAfter] = useState<string>("");
  const [createdBefore, setCreatedBefore] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<any>(null);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      target !== "all" ||
      isUrgent !== "all" ||
      createdAfter ||
      createdBefore ||
      searchQuery
    );
  }, [target, isUrgent, createdAfter, createdBefore, searchQuery]);

  // Build the query params for API call
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage,
    };

    if (target && target !== "all") {
      params.target = target;
    }

    if (isUrgent !== "all") {
      params.is_urgent = isUrgent === "true";
    }

    if (sort) {
      params.sort = sort; // Add the sort param here
    }

    if (createdAfter) {
      params.created_after = createdAfter;
    }

    if (createdBefore) {
      params.created_before = createdBefore;
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    return params;
  }, [
    currentPage,
    target,
    isUrgent,
    sort,
    createdAfter,
    createdBefore,
    searchQuery,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [target, isUrgent, createdAfter, createdBefore, searchQuery]);

  // Fetch announcements with the current filters
  const { data, isLoading, error, refetch } = useQuery<AnnouncementResponse>({
    queryKey: ["announcements", queryParams],
    queryFn: () => fetchAnnouncements(queryParams),
  });

  // Clear all filters
  const clearFilters = () => {
    setTarget("all");
    setIsUrgent("all");
    setCreatedAfter("");
    setCreatedBefore("");
    setSearchQuery("");
  };

  // Navigation handlers
  const handleCreateAnnouncement = () => {
    router.push("/dashboard/announcements/create");
  };

  const handleEditAnnouncement = (id: number) => {
    router.push(`/dashboard/announcements/${id}/edit`);
  };

  // Delete announcement handlers
  const confirmDeleteAnnouncement = (announcement: any) => {
    setAnnouncementToDelete(announcement);
    setDeleteModalOpen(true);
  };

  const performDeleteAnnouncement = async () => {
    try {
      // Implement your delete function here
      // await deleteAnnouncement(announcementToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  // Get target audience display text
  const getTargetDisplayText = (target: string) => {
    const targetMap: Record<string, string> = {
      all_users: t("allUsers"),
      staff: t("staffOnly"),
      students: t("studentsOnly"),
      parents: t("parentsOnly"),
    };
    return targetMap[target] || target;
  };

  // Announcement actions dropdown
  const renderAnnouncementActions = (announcement: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleEditAnnouncement(announcement.id)}
        >
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => confirmDeleteAnnouncement(announcement)}
        >
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render announcement cards or loading/error states
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-0">
                <Skeleton className="h-8 w-60" />
              </CardHeader>
              <CardContent className="pt-4">
                <Skeleton className="h-5 w-36 mb-4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-destructive py-10 bg-destructive/5 rounded-lg">
          <h3 className="text-lg font-medium mb-2">
            {t("errorLoadingAnnouncements")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("tryAgainLater")}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("retry")}
          </Button>
        </div>
      );
    }

    if (!data || !data.results.length) {
      return (
        <div className="text-center py-16 bg-muted/20 rounded-lg">
          <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {t("noAnnouncementsFound")}
          </h3>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mb-4">
              {t("tryChangingFilters")}
            </p>
          )}
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="mx-auto"
            >
              <X className="h-4 w-4 mr-2" />
              {t("clearFilters")}
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {data.results.map((announcement) => (
          <Card
            key={announcement.id}
            className={cn(
              "hover:shadow-md transition-shadow border-l-4",
              announcement.is_urgent ? "border-l-red-500" : "border-l-blue-500"
            )}
          >
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-6 pb-2">
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <CardTitle className="text-xl">
                    {announcement.title}
                  </CardTitle>
                  {announcement.is_urgent && (
                    <Badge variant="destructive" className="mt-0.5">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {t("urgent")}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formatDate(announcement.created_at, { includeTime: true })}
                  </p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    {getTargetDisplayText(announcement.target)}
                  </p>
                </div>
              </div>
              {renderAnnouncementActions(announcement)}
            </CardHeader>
            <CardContent className="p-6 pt-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {announcement.content}
              </p>
              {announcement.expires_at && (
                <div className="mt-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t("expiresOn")}: {formatDate(announcement.expires_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  // Generate pagination numbers with ellipses for large page counts
  const getPaginationNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (currentPage <= 4) {
      // Show first 5 pages, ellipsis, last page
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("ellipsis1");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Show first page, ellipsis, last 5 pages
      pages.push(1);
      pages.push("ellipsis1");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
      pages.push(1);
      pages.push("ellipsis1");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("ellipsis2");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header and create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <PageHeader
          title={t("announcementsTitle")}
          description={t("announcementsDescription")}
        />
        <Button
          onClick={handleCreateAnnouncement}
          size="default"
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createAnnouncement")}
        </Button>
      </div>

      {/* Search and Filter bar */}
      <div className="bg-card border rounded-lg p-4 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchAnnouncements")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  className={
                    hasActiveFilters ? "bg-priamry/90 hover:bg-primary" : ""
                  }
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t("filters")}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5">
                      {countActiveFilters()}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h3 className="font-medium">{t("filterAnnouncements")}</h3>

                  <div className="space-y-2">
                    <Label htmlFor="target">{t("targetAudience")}</Label>
                    <select
                      id="target"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full p-2 border rounded cursor-pointer bg-background"
                    >
                      <option value="all">{t("allTargets")}</option>
                      <option value="school">{t("school")}</option>
                      <option value="class">{t("class")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency">{t("urgency")}</Label>
                    <select
                      id="urgency"
                      value={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.value)}
                      className="w-full p-2 border rounded cursor-pointer bg-background"
                    >
                      <option value="all">{t("allUrgency")}</option>
                      <option value="true">{t("urgentOnly")}</option>
                      <option value="false">{t("nonUrgentOnly")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="created-after">{t("createdAfter")}</Label>
                    <Input
                      id="created-after"
                      type="date"
                      value={createdAfter}
                      onChange={(e) => setCreatedAfter(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="created-before">{t("createdBefore")}</Label>
                    <Input
                      id="created-before"
                      type="date"
                      value={createdBefore}
                      onChange={(e) => setCreatedBefore(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                    >
                      {t("clearFilters")}
                    </Button>
                    <Button
                      onClick={() => setFilterOpen(false)}
                      className="bg-primary/90 hover:bg-primary"
                    >
                      {t("applyFilters")}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {target !== "all" && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("target")}: {getTargetDisplayText(target)}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setTarget("all")}
                />
              </Badge>
            )}

            {isUrgent !== "all" && (
              <Badge variant="secondary" className="px-3 py-1">
                {isUrgent === "true" ? t("urgent") : t("nonUrgent")}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setIsUrgent("all")}
                />
              </Badge>
            )}

            {createdAfter && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("from")}: {formatDate(createdAfter)}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setCreatedAfter("")}
                />
              </Badge>
            )}

            {createdBefore && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("to")}: {formatDate(createdBefore)}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setCreatedBefore("")}
                />
              </Badge>
            )}

            {searchQuery && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("search")}: {searchQuery}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-sm h-7"
            >
              {t("clearAll")}
            </Button>
          </div>
        )}
      </div>

      {/* Main content */}
      {renderContent()}

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
            className={
              currentPage <= 1 ? "cursor-not-allowed" : "cursor-pointer"
            }
          >
            {t("previous")}
          </Button>

          {getPaginationNumbers().map((page, index) => {
            if (page === "ellipsis1" || page === "ellipsis2") {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2">
                  ...
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page as number)}
                className={cn(
                  "cursor-pointer w-10 h-10",
                  currentPage === page && "bg-primary/90 hover:bg-primary"
                )}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage >= totalPages}
            className={
              currentPage >= totalPages
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }
          >
            {t("next")}
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {announcementToDelete && (
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirmDeletion")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              {t("deleteAnnouncementConfirmation")}:{" "}
              <strong>{announcementToDelete.title}</strong>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={performDeleteAnnouncement}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );

  // Helper function to count active filters
  function countActiveFilters() {
    let count = 0;
    if (target !== "all") count++;
    if (isUrgent !== "all") count++;
    if (createdAfter) count++;
    if (createdBefore) count++;
    if (searchQuery) count++;
    return count;
  }
};

export default AnnouncementsPage;
