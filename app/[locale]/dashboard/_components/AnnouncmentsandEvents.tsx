"use client";
import React, { useState } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Bell, CalendarIcon, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export const EnhancedAnnouncements = ({
  announcementsData,
  announcementsLoading,
  announcementsError,
}) => {
  const t = useTranslations("announcements");
  const router = useRouter();

  return (
    <Card className="overflow-hidden bg-white shadow-md rounded-xl border-0">
      <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
        <CardTitle className="text-lg font-semibold flex items-center text-white">
          <Bell className="h-5 w-5 mr-2" />
          {t("title")}
        </CardTitle>
      </div>
      <CardContent className="p-5">
        <div className="space-y-4">
          {announcementsLoading ? (
            <div className="text-center py-6 text-gray-500">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
              <div className="animate-pulse h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          ) : announcementsError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("error.title")}</AlertTitle>
              <AlertDescription>
                {(announcementsError as Error).message}
              </AlertDescription>
            </Alert>
          ) : announcementsData && announcementsData.results.length > 0 ? (
            announcementsData.results.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg p-4 shadow-sm transition-all hover:shadow-md border-l-4 ${
                  announcement.is_urgent ? "border-red-500" : "border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    {announcement.title}
                    {announcement.is_urgent && (
                      <Badge variant="destructive" className="ml-2">
                        {t("urgent")}
                      </Badge>
                    )}
                  </h3>
                  <div className="bg-gray-100 text-xs rounded-full px-2 py-1 text-gray-600">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {announcement.content}
                </p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Bell className="h-10 w-10 text-gray-300 mb-3" />
              <p>{t("noAnnouncements")}</p>
            </div>
          )}

          {announcementsData && announcementsData.results.length > 0 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-sm text-gray-600 justify-between"
              onClick={() => router.push("/dashboard/announcements")}
            >
              {t("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const EnhancedCalendar = ({
  selectedDate,
  setSelectedDate,
  eventsData,
  eventsLoading,
  eventsError,
  eventsForSelectedDate,
}) => {
  const t = useTranslations("calendar");
  const router = useRouter();

  return (
    <Card className="overflow-hidden bg-white shadow-md rounded-xl border-0">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <CardTitle className="text-lg font-semibold flex items-center text-white">
          <CalendarIcon className="h-5 w-5 mr-2" />
          {t("title")}
        </CardTitle>
      </div>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg border border-gray-200 max-w-none shadow-sm"
              modifiers={{
                event:
                  eventsData?.results && eventsData.results.length > 0
                    ? eventsData.results.map(
                        (event) => new Date(event.start_date)
                      )
                    : [],
              }}
              modifiersStyles={{
                event: {
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "4px",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                },
              }}
              styles={{
                day_today: {
                  fontWeight: "bold",
                  color: "hsl(var(--primary))",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                },
                day_selected: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontWeight: "bold",
                },
                nav_button_previous: {
                  color: "hsl(var(--muted-foreground))",
                },
                nav_button_next: { color: "hsl(var(--muted-foreground))" },
                head_cell: {
                  color: "hsl(var(--muted-foreground))",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                },
                day: { color: "hsl(var(--foreground))" },
              }}
            />
          </div>
          <div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
              <h3 className="text-md font-semibold text-gray-900">
                {selectedDate?.toLocaleDateString(t("locale"), {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {eventsLoading ? (
                <div className="flex flex-col gap-3">
                  <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
                </div>
              ) : eventsError ? (
                <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
                  {t("error.message", {
                    message: (eventsError as Error).message,
                  })}
                </div>
              ) : !eventsData || !eventsData.results ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-10 w-10 text-gray-300 mb-3" />
                  <p>{t("dataNotAvailable")}</p>
                </div>
              ) : eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map((event, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900">
                        {event.title}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {new Date(event.start_date).toLocaleTimeString(
                          t("locale"),
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {event.description}
                    </p>
                    <div className="mt-6 text-xs text-gray-500 flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      {new Date(event.start_date).toLocaleTimeString(
                        t("locale"),
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}{" "}
                      -{" "}
                      {new Date(event.end_date).toLocaleTimeString(
                        t("locale"),
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-10 w-10 text-gray-300 mb-3" />
                  <p>{t("noEvents")}</p>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-10 text-sm"
              onClick={() => router.push("/dashboard/calendar/create")}
            >
              {t("scheduleNew")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
