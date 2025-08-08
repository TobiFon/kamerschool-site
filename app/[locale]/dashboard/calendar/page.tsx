"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import {
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  List,
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { useTranslations } from "next-intl";
import PageHeader from "../_components/PageHeader";
import { formatDate } from "@/lib/utils";
import { fetchCalendarEvents, deleteCalendarEvent } from "@/queries/events";
import { CalendarEvent, CalendarEventResponse } from "@/types/events";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isSameDay } from "date-fns";

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
  };
};

const CalendarEventsPage: React.FC = () => {
  const t = useTranslations("Events");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser();

  const [view, setView] = useState<"list" | "calendar">("list");
  const [eventType, setEventType] = useState<string>("all");
  const [sort, setSort] = useState<string>("created_at_desc");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null
  );

  const hasActiveFilters = useMemo(
    () =>
      eventType !== "all" ||
      (startDate && view === "list") ||
      (endDate && view === "list") ||
      searchQuery,
    [eventType, startDate, endDate, searchQuery, view]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [eventType, sort, startDate, endDate, searchQuery]);

  const baseParams = useMemo(() => {
    const params = new URLSearchParams();
    if (eventType !== "all") params.append("event_type", eventType);
    if (sort) params.append("sort", sort);
    if (searchQuery) params.append("search", searchQuery);
    return params;
  }, [eventType, sort, searchQuery]);

  const listViewUrl = useMemo(() => {
    const params = new URLSearchParams(baseParams);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    params.append("page", currentPage.toString());
    return `${process.env.NEXT_PUBLIC_API_URL}/events/?${params.toString()}`;
  }, [baseParams, startDate, endDate, currentPage]);

  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
    refetch: refetchList,
  } = useQuery<CalendarEventResponse>({
    queryKey: ["calendar-events", "list", listViewUrl],
    queryFn: () => fetchCalendarEvents({ url: listViewUrl }),
    enabled: view === "list",
  });

  const calendarViewUrl = useMemo(() => {
    const params = new URLSearchParams(baseParams);
    const { start_date, end_date } = getMonthBounds(currentMonth);
    params.append("start_date", start_date);
    params.append("end_date", end_date);
    params.append("limit", "1000");
    return `${process.env.NEXT_PUBLIC_API_URL}/events/?${params.toString()}`;
  }, [baseParams, currentMonth]);

  const {
    data: calendarData,
    isLoading: isCalendarLoading,
    error: calendarError,
  } = useQuery<CalendarEventResponse>({
    queryKey: ["calendar-events", "calendar", calendarViewUrl],
    queryFn: () => fetchCalendarEvents({ url: calendarViewUrl }),
    enabled: view === "calendar",
  });

  const clearFilters = () => {
    setEventType("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  const handleCreateEvent = () => router.push("/dashboard/calendar/create");
  const handleEditEvent = (id: number) =>
    router.push(`/dashboard/calendar/${id}/edit`);

  const confirmDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const performDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteCalendarEvent(eventToDelete.id);
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const EventCard: React.FC<{ event: CalendarEvent }> = ({ event }) => (
    <Card
      className="hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: getEventTypeColor(event.event_type) }}
    >
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div>
          <CardTitle className="text-lg">{event.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t("createdOn")}:{" "}
            {formatDate(event.created_at, { includeTime: true })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              disabled={!canEdit}
            >
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
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="flex items-center text-sm mb-2 sm:mb-0">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {formatDate(event.start_date)} - {formatDate(event.end_date)}
            </span>
          </div>
          <Badge variant="secondary">{event.event_type}</Badge>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {event.description}
          </p>
        )}
        {event.is_recurring && (
          <Badge variant="outline" className="mt-3">
            {t("recurring")}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  const CalendarView = () => {
    const eventDates = useMemo(() => {
      const dates = new Set<string>();
      if (calendarData?.results) {
        calendarData.results.forEach((event) =>
          dates.add(new Date(event.start_date).toDateString())
        );
      }
      return Array.from(dates).map((dateStr) => new Date(dateStr));
    }, [calendarData]);

    const eventsForSelectedDate = useMemo(() => {
      if (!calendarData?.results || !selectedDate) return [];
      return calendarData.results.filter((event) =>
        isSameDay(new Date(event.start_date), selectedDate)
      );
    }, [calendarData, selectedDate]);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="p-0"
                classNames={{
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  day_today: "bg-accent text-accent-foreground",
                }}
                modifiers={{ hasEvents: eventDates }}
                modifiersClassNames={{ hasEvents: "day-with-event" }}
              />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            {t("eventsFor")} {selectedDate ? formatDate(selectedDate) : "..."}
          </h2>
          {isCalendarLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : calendarError ? (
            <div className="text-center text-destructive py-10 bg-destructive/5 rounded-lg">
              <h3 className="text-lg font-medium">{t("errorLoadingEvents")}</h3>
            </div>
          ) : eventsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {eventsForSelectedDate.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/20 rounded-lg">
              <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t("noEventsForDate")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("selectAnotherDate")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ListView = () => {
    if (isListLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      );
    }
    if (listError) {
      return (
        <div className="text-center text-destructive py-10 bg-destructive/5 rounded-lg">
          <h3 className="text-lg font-medium mb-2">
            {t("errorLoadingEvents")}
          </h3>
          <Button onClick={() => refetchList()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("retry")}
          </Button>
        </div>
      );
    }
    if (!listData || !listData.results.length) {
      return (
        <div className="text-center py-16 bg-muted/20 rounded-lg">
          <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("noEventsFound")}</h3>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mb-4">
              {t("tryChangingFilters")}
            </p>
          )}
        </div>
      );
    }

    const totalPages = Math.ceil(listData.count / 20);

    return (
      <>
        <div className="space-y-4">
          {listData.results.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        {totalPages > 1 && (
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        )}
      </>
    );
  };

  const Pagination: React.FC<{
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }> = ({ totalPages, currentPage, onPageChange }) => (
    <div className="mt-8 flex justify-center items-center gap-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        {t("previous")}
      </Button>
      <span className="px-4 text-sm font-medium">
        {t("page")} {currentPage} {t("of")} {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        {t("next")}
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <PageHeader title={t("eventsTitle")} />
        <Button onClick={handleCreateEvent} size="default" disabled={!canEdit}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createEvent")}
        </Button>
      </div>

      <Card className="p-4 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchEvents")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-background p-1">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1 sm:mr-2" />{" "}
                <span className="hidden sm:inline">{t("listView")}</span>
              </Button>
              <Button
                variant={view === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
                className="h-8 px-3"
              >
                <CalendarIcon className="h-4 w-4 mr-1 sm:mr-2" />{" "}
                <span className="hidden sm:inline">{t("calendarView")}</span>
              </Button>
            </div>
            {view === "list" && (
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {t("filters")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h3 className="font-medium">{t("filterEvents")}</h3>
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
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="p-2 border rounded-md text-sm h-10 bg-background"
            >
              <option value="all">{t("allTypes")}</option>
              <option value="meeting">{t("meeting")}</option>
              <option value="exam">{t("exam")}</option>
              <option value="holiday">{t("holiday")}</option>
              <option value="other">{t("other")}</option>
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            <span className="text-sm font-medium mr-2">
              {t("activeFilters")}:
            </span>
            {eventType !== "all" && (
              <Badge variant="secondary">
                {t("type")}: {eventType}
                <X
                  className="h-3 w-3 ml-1.5 cursor-pointer"
                  onClick={() => setEventType("all")}
                />
              </Badge>
            )}
            {startDate && view === "list" && (
              <Badge variant="secondary">
                {t("from")}: {formatDate(startDate)}
                <X
                  className="h-3 w-3 ml-1.5 cursor-pointer"
                  onClick={() => setStartDate("")}
                />
              </Badge>
            )}
            {endDate && view === "list" && (
              <Badge variant="secondary">
                {t("to")}: {formatDate(endDate)}
                <X
                  className="h-3 w-3 ml-1.5 cursor-pointer"
                  onClick={() => setEndDate("")}
                />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary">
                {t("search")}: {searchQuery}
                <X
                  className="h-3 w-3 ml-1.5 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-primary h-auto p-1 text-xs"
            >
              {t("clearAll")}
            </Button>
          </div>
        )}
      </Card>

      {view === "list" ? <ListView /> : <CalendarView />}

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
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={performDeleteEvent}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

const getEventTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    meeting: "#3b82f6",
    exam: "#ef4444",
    holiday: "#10b981",
    other: "#a855f7",
  };
  return colors[type.toLowerCase()] || "#6b7280";
};

export default CalendarEventsPage;
