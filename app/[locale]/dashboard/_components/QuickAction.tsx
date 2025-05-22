"use client";
import React from "react";
import { QuickActionButton, QuickActionButtonProps } from "./QuickActionButton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface ActionItem extends QuickActionButtonProps {}

interface QuickActionsProps {
  actions: ActionItem[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <ScrollArea className="w-full pb-4">
      <div className="flex gap-4">
        {actions.map((action, index) => (
          <QuickActionButton
            key={index}
            {...action}
            className={`${action.className} transition-transform hover:scale-105 shadow-lg hover:shadow-xl`}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
