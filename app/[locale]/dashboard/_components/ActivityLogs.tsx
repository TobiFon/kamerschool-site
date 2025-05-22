// components/dashboard/_components/ActivityLogsCard.tsx
import React from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { ActivitySquare, User, Clock, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchActivityLogs } from "@/queries/activitylogs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export const ActivityLogsCard: React.FC = () => {
  const t = useTranslations("activityLogs");

  const {
    data: activityLogs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["activityLogs"],
    queryFn: fetchActivityLogs,
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 border-green-200";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return "➕";
      case "UPDATE":
        return "🔄";
      default:
        return "📋";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(t("locale"), {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Card className="overflow-hidden bg-white shadow-md rounded-xl border-0">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
        <CardTitle className="text-lg font-semibold flex justify-between items-center text-white">
          <span className="flex items-center">
            <ActivitySquare className="h-5 w-5 mr-2" />
            {t("title")}
          </span>
          <Badge variant="outline" className="bg-white/20 text-white border-0">
            {t("entriesCount", { count: activityLogs?.results?.length || 0 })}
          </Badge>
        </CardTitle>
      </div>

      <CardContent className="p-5">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>{t("error.title")}</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          ) : !activityLogs || !activityLogs.results ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <ActivitySquare className="h-10 w-10 text-gray-300 mb-3" />
              <p>{t("dataNotAvailable")}</p>
            </div>
          ) : activityLogs.results.length > 0 ? (
            activityLogs.results.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.activity}
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getActionColor(activity.action)}`}
                  >
                    <span className="mr-1">
                      {getActionIcon(activity.action)}
                    </span>
                    {t(`actions.${activity.action.toLowerCase()}`)}
                  </Badge>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center text-xs text-gray-600">
                    <User className="h-3 w-3 mr-1" />
                    {activity.user}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <ActivitySquare className="h-10 w-10 text-gray-300 mb-3" />
              <p>{t("noActivities")}</p>
            </div>
          )}
        </div>

        {activityLogs &&
          activityLogs.results &&
          activityLogs.results.length > 0 && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-sm text-gray-600 justify-between"
            >
              {t("viewAll")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
      </CardContent>
    </Card>
  );
};
