"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Clock, Trash2, Plus, Edit3, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  TimeSlot,
  TimetableEntry,
  ScheduledClassSubject,
} from "@/types/timetable";

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5];
const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

interface TimetableGridProps {
  timeSlots: TimeSlot[];
  entries: TimetableEntry[];
  isLoading: boolean;
  canEdit: boolean; // Prop to receive permission status

  onCellClick: (
    dayOfWeek: number,
    timeSlotId: number,
    existingSlot: TimetableEntry | undefined
  ) => void;
  onDeleteScheduledSubject: (scheduledSubject: ScheduledClassSubject) => void;
  onDeleteEntireSlot: (slot: TimetableEntry) => void;
}

const findSlotEntry = (
  entries: TimetableEntry[],
  dayOfWeek: number,
  timeSlotId: number
): TimetableEntry | undefined => {
  return entries.find(
    (entry) =>
      entry.day_of_week === dayOfWeek && entry.time_slot.id === timeSlotId
  );
};

const TimetableGrid: React.FC<TimetableGridProps> = ({
  timeSlots,
  entries,
  isLoading,
  canEdit, // Receive the permission status
  onCellClick,
  onDeleteScheduledSubject,
  onDeleteEntireSlot,
}) => {
  const tGrid = useTranslations("Timetable.Grid");
  const tDays = useTranslations("Days");
  const tCommon = useTranslations("Common");

  if (isLoading) {
    const SKELETON_DAYS = 6;
    const SKELETON_PERIODS = Math.max(timeSlots.length, 5);
    return (
      <div className="border rounded-lg overflow-hidden shadow-md">
        <div
          className={`grid`}
          style={{
            gridTemplateColumns: `minmax(100px, auto) repeat(${SKELETON_PERIODS}, minmax(160px, 1fr))`,
          }}
        >
          <div className="p-3 border-b border-r bg-muted/60 sticky top-0 left-0 z-30">
            <Skeleton className="h-5 w-12" />
          </div>
          {Array.from({ length: SKELETON_PERIODS }).map((_, i) => (
            <div
              key={`skel-head-period-${i}`}
              className="p-3 border-b border-r bg-muted/60 sticky top-0 z-20 flex flex-col items-center justify-center"
            >
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
          {Array.from({ length: SKELETON_DAYS }).map((_, dayIndex) => (
            <React.Fragment key={`skel-day-row-${dayIndex}`}>
              <div className="p-3 border-b border-r bg-muted/60 sticky left-0 z-20 flex items-center font-medium">
                <Skeleton className="h-5 w-20" />
              </div>
              {Array.from({ length: SKELETON_PERIODS }).map(
                (_, periodIndex) => (
                  <div
                    key={`skel-cell-${dayIndex}-${periodIndex}`}
                    className="p-1.5 border-b border-r min-h-[120px]"
                  >
                    <Skeleton className="h-full w-full rounded" />
                  </div>
                )
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30 shadow-sm">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="font-semibold text-lg">{tGrid("noTimeSlotsTitle")}</p>
        <p className="text-sm mt-1">{tGrid("noTimeSlotsDescription")}</p>
      </div>
    );
  }

  const dayColumnWidth = "minmax(110px, auto)";
  const periodColumnWidth = "minmax(180px, 1fr)";

  return (
    <TooltipProvider delayDuration={100}>
      <div className="border rounded-lg overflow-auto shadow-md bg-card">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${dayColumnWidth} repeat(${timeSlots.length}, ${periodColumnWidth})`,
            minWidth: `${110 + timeSlots.length * 180}px`,
          }}
        >
          <div className="p-2.5 border-b border-r text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/70 sticky top-0 left-0 z-30 flex items-center justify-center"></div>
          {timeSlots.map((slot) => (
            <div
              key={`header-slot-${slot.id}`}
              className="p-2.5 border-b border-r text-xs font-semibold text-center bg-muted/70 sticky top-0 z-20 flex flex-col justify-center items-center"
              title={`${slot.name} (${slot.start_time.substring(
                0,
                5
              )} - ${slot.end_time.substring(0, 5)})`}
            >
              <span className="truncate block max-w-[160px]">{slot.name}</span>
              <span className="text-muted-foreground/80 font-normal block">
                {slot.start_time.substring(0, 5)} -{" "}
                {slot.end_time.substring(0, 5)}
              </span>
            </div>
          ))}

          {DAYS_OF_WEEK.map((day) => (
            <React.Fragment key={`row-${day}`}>
              <div className="p-2.5 border-b border-r font-semibold text-sm text-center bg-muted/70 sticky left-0 z-20 flex items-center justify-center">
                {tDays(DAY_KEYS[day])}
              </div>

              {timeSlots.map((ts) => {
                const slotEntry = findSlotEntry(entries, day, ts.id);
                const cellKey = `cell-${day}-${ts.id}`;

                return (
                  <div
                    key={cellKey}
                    className={cn(
                      "border-b border-r p-1.5 min-h-[120px] flex flex-col group relative transition-colors duration-150 ease-in-out",
                      canEdit &&
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                      canEdit &&
                        !slotEntry &&
                        "hover:bg-primary/5 cursor-pointer",
                      canEdit &&
                        slotEntry &&
                        "hover:bg-muted/30 cursor-pointer",
                      !canEdit && "cursor-not-allowed bg-muted/20" // Visual cue for disabled cells
                    )}
                    onClick={
                      canEdit
                        ? () => onCellClick(day, ts.id, slotEntry)
                        : undefined
                    }
                    tabIndex={canEdit ? 0 : -1}
                    onKeyDown={(e) => {
                      if (canEdit && (e.key === "Enter" || e.key === " ")) {
                        onCellClick(day, ts.id, slotEntry);
                      }
                    }}
                  >
                    {slotEntry ? (
                      <div className="flex-grow flex flex-col justify-between h-full">
                        <div className="space-y-1 flex-grow overflow-y-auto max-h-[75px] mb-1 custom-scrollbar pr-1">
                          {slotEntry.scheduled_subjects.length > 0 ? (
                            slotEntry.scheduled_subjects.map((ss) => (
                              <div
                                key={ss.id}
                                className="bg-card border text-xs rounded p-1.5 shadow-sm group/item relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p
                                  className="font-semibold text-primary truncate"
                                  title={ss.class_subject.subject.name}
                                >
                                  {ss.class_subject.subject.name}
                                </p>
                                {ss.class_subject.teacher && (
                                  <p
                                    className="text-muted-foreground truncate text-[0.7rem]"
                                    title={ss.class_subject.teacher.name}
                                  >
                                    T: {ss.class_subject.teacher.name}
                                  </p>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      className="h-5 w-5 text-destructive hover:bg-destructive/10 absolute top-0.5 right-0.5 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100"
                                      onClick={() =>
                                        onDeleteScheduledSubject(ss)
                                      }
                                      title={tGrid("removeSubjectTooltip")}
                                      disabled={!canEdit}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span className="sr-only">
                                        {tCommon("delete")}
                                      </span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="p-1.5 text-xs"
                                  >
                                    <p>{tGrid("removeSubjectTooltip")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic px-2 text-center">
                              {tGrid("emptySlotManage")}
                            </div>
                          )}
                        </div>
                        <div className="mt-auto pt-1 border-t border-dashed border-border/30 flex justify-between items-center gap-1">
                          {slotEntry.notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p
                                  className="text-xs text-muted-foreground italic line-clamp-1 flex-grow cursor-default overflow-hidden text-ellipsis whitespace-nowrap pr-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {slotEntry.notes}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="p-1.5 text-xs max-w-xs"
                              >
                                <p className="whitespace-pre-wrap">
                                  {slotEntry.notes}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <div className="flex-shrink-0 ml-auto">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="h-6 w-6 text-blue-600 hover:bg-blue-600/10"
                                  onClick={(e) => {
                                    if (canEdit) {
                                      e.stopPropagation();
                                      onCellClick(day, ts.id, slotEntry);
                                    }
                                  }}
                                  title={tGrid("manageSlotTooltip")}
                                  disabled={!canEdit}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {tGrid("manageSlot")}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="p-1.5 text-xs"
                              >
                                <p>{tGrid("manageSlotTooltip")}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    if (canEdit) {
                                      e.stopPropagation();
                                      onDeleteEntireSlot(slotEntry);
                                    }
                                  }}
                                  title={tGrid("deleteSlotTooltip")}
                                  disabled={!canEdit}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span className="sr-only">
                                    {tGrid("deleteSlot")}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="p-1.5 text-xs"
                              >
                                <p>{tGrid("deleteSlotTooltip")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-grow w-full h-full flex items-center justify-center text-muted-foreground/50 rounded transition-all duration-150 ease-in-out">
                        {canEdit && (
                          <Plus className="h-5 w-5 opacity-30 group-hover:opacity-100 group-focus-visible:opacity-100 transform group-hover:scale-110 transition-all duration-150" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TimetableGrid;
