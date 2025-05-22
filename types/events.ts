// types/events.ts
export interface CalendarEvent {
  id: number;
  user: number;
  event_type: string;
  title: string;
  description: string;
  start_date: string; // ISO 8601 datetime string
  end_date: string; // ISO 8601 datetime string
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CalendarEvent[];
}

import * as z from "zod";

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters" }),
    description: z
      .string()
      .optional()
      .refine((val) => val === undefined || val.length >= 10, {
        message: "Description must be at least 10 characters",
      }),
    event_type: z.enum(["holiday", "meeting", "exam", "other"], {
      required_error: "Event type is required",
    }),
    start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    }),
    end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date",
    }),
    is_recurring: z.boolean().optional().default(false),
  })
  .refine((data) => new Date(data.start_date) < new Date(data.end_date), {
    message: "Start date must be before end date",
    path: ["end_date"],
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
