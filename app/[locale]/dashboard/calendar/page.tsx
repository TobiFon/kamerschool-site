"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  RefreshCw,
  Filter,
  X,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { formatDate } from "@/lib/utils";
import { fetchCalendarEvents, deleteCalendarEvent } from "@/queries/events";
import { CalendarEventResponse } from "@/types/events";

const CalendarEventsPage: React.FC = () => {
  const t = useTranslations("Events");
  const router = useRouter();
  const queryClient = useQueryClient();

  // States for filters and pagination
  const [eventType, setEventType] = useState<string>("all");
  const [sort, setSort] = useState<string>("created_at_desc"); // Default to newest first
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return eventType !== "all" || startDate || endDate || searchQuery;
  }, [eventType, startDate, endDate, searchQuery]);

  // Build the URL with all filters
  const baseUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (eventType && eventType !== "all") {
      params.append("event_type", eventType);
    }

    if (sort) {
      params.append("sort", sort);
    }

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/events/?${params.toString()}`;
  }, [eventType, sort, startDate, endDate, searchQuery]);

  // Add page parameter to URL
  const urlWithPage = useMemo(() => {
    const separator = baseUrl.endsWith("?") ? "" : "&";
    return `${baseUrl}${separator}page=${currentPage}`;
  }, [baseUrl, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [eventType, sort, startDate, endDate, searchQuery]);

  // Fetch events with the current filters
  const { data, isLoading, error, refetch } = useQuery<CalendarEventResponse>({
    queryKey: ["calendar-events", urlWithPage],
    queryFn: () => fetchCalendarEvents({ url: urlWithPage }),
  });

  // Clear all filters
  const clearFilters = () => {
    setEventType("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  // Navigation handlers
  const handleCreateEvent = () => {
    router.push("/dashboard/calendar/create");
  };

  const handleEditEvent = (id: number) => {
    router.push(`/dashboard/calendar/${id}/edit`);
  };

  // Delete event handlers
  const confirmDeleteEvent = (event: any) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const performDeleteEvent = async () => {
    try {
      await deleteCalendarEvent(eventToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  // Event actions dropdown
  const renderEventActions = (event: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEditEvent(event.id)}>
          {t("edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => confirmDeleteEvent(event)}
        >
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render event cards or loading/error states
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
            {t("errorLoadingEvents")}
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
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("noEventsFound")}</h3>
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
        {data.results.map((event) => (
          <Card
            key={event.id}
            className="hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: getEventTypeColor(event.event_type) }}
          >
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 p-6 pb-2">
              <div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("createdOn")}:{" "}
                  {formatDate(event.created_at, { includeTime: true })}
                </p>
              </div>
              {renderEventActions(event)}
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div className="flex items-center mb-2 sm:mb-0">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>
                    {formatDate(event.start_date)} -{" "}
                    {formatDate(event.end_date)}
                  </span>
                </div>
                <Badge variant="secondary" className="mt-2 sm:mt-0">
                  {event.event_type}
                </Badge>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
                  {event.description}
                </p>
              )}
              {event.is_recurring && (
                <Badge variant="outline" className="mt-4">
                  {t("recurring")}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Helper function to get a color for event types
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: "#3b82f6", // Blue
      exam: "#ef4444", // Red
      holiday: "#10b981", // Green
      other: "#a855f7", // Purple
    };

    return colors[type.toLowerCase()] || "#6b7280"; // Default gray
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
        <PageHeader title={t("eventsTitle")} />
        <Button onClick={handleCreateEvent} size="default">
          <Plus className="h-4 w-4 mr-2" />
          {t("createEvent")}
        </Button>
      </div>

      {/* Search and Filter bar */}
      <div className="bg-card border rounded-lg p-4 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchEvents")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="p-2 border rounded cursor-pointer bg-background"
            >
              <option value="created_at_desc">{t("newestFirst")}</option>
              <option value="created_at_asc">{t("oldestFirst")}</option>
              <option value="start_date_asc">{t("upcomingEvents")}</option>
              <option value="start_date_desc">{t("furthestEvents")}</option>
            </select>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant={hasActiveFilters ? "default" : "outline"}>
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
                  <h3 className="font-medium">{t("filterEvents")}</h3>

                  <div className="space-y-2">
                    <Label htmlFor="event-type">{t("eventType")}</Label>
                    <select
                      id="event-type"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full p-2 border rounded cursor-pointer bg-background"
                    >
                      <option value="all">{t("allTypes")}</option>
                      <option value="meeting">{t("meeting")}</option>
                      <option value="exam">{t("exam")}</option>
                      <option value="holiday">{t("holiday")}</option>
                      <option value="other">{t("other")}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-date">{t("startDate")}</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-date">{t("endDate")}</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
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
                    <Button onClick={() => setFilterOpen(false)}>
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
            {eventType !== "all" && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("type")}: {eventType}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setEventType("all")}
                />
              </Badge>
            )}

            {startDate && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("from")}: {formatDate(startDate)}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setStartDate("")}
                />
              </Badge>
            )}

            {endDate && (
              <Badge variant="secondary" className="px-3 py-1">
                {t("to")}: {formatDate(endDate)}
                <X
                  className="h-3 w-3 ml-2 cursor-pointer"
                  onClick={() => setEndDate("")}
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
                className="cursor-pointer w-10 h-10"
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
      {eventToDelete && (
        <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirmDeletion")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              {t("deleteEventConfirmation")}:{" "}
              <strong>{eventToDelete.title}</strong>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={performDeleteEvent}
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
    if (eventType !== "all") count++;
    if (startDate) count++;
    if (endDate) count++;
    if (searchQuery) count++;
    return count;
  }
};

export default CalendarEventsPage;
