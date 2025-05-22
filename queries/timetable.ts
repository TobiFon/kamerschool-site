import { authFetch } from "@/lib/auth";
import { buildUrl } from "./students"; // Assuming buildUrl is generic enough
import { getBackendErrorMessage } from "@/lib/utils";
import {
  TimeSlot,
  TimeSlotFormData,
  PaginatedTimeSlotsResponse,
  FetchTimeSlotsParams,
  ClassTimetable,
  ClassTimetableFormData,
  PaginatedClassTimetablesResponse,
  FetchClassTimetablesParams,
  TimetableEntry,
  TimetableEntryFormData,
  PaginatedTimetableEntriesResponse, // Added for listing slots
  FetchTimetableEntriesParams,
  MultiPeriodEntryFormData,
  FetchTeacherScheduleParams,
  FetchClassActiveScheduleParams,
  ScheduledClassSubject, // New
  ScheduledClassSubjectFormData, // New
  PaginatedScheduledClassSubjectsResponse, // New
  FetchScheduledClassSubjectsParams, // New
  TeacherScheduleEntry,
  FetchStudentTimetableParams,
  StudentTimetableResponse, // New for teacher schedule view
} from "@/types/timetable";

const API_BASE_PATH = "/timetables";

// --- TimeSlot API Functions (No changes from previous version) ---
export async function fetchTimeSlots(
  params: FetchTimeSlotsParams
): Promise<PaginatedTimeSlotsResponse> {
  const path = `${API_BASE_PATH}/time-slots/`;
  const queryParams: Record<string, any> = { ...params };
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );
  const url = buildUrl(path, queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to fetch time slots. Status: ${res.status}`
      );
    return res.json() as Promise<PaginatedTimeSlotsResponse>;
  } catch (error) {
    throw error;
  }
}

export async function createTimeSlot(
  data: TimeSlotFormData
): Promise<TimeSlot> {
  const path = `${API_BASE_PATH}/time-slots/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to create time slot. Status: ${res.status}`
      );
    return res.json() as Promise<TimeSlot>;
  } catch (error) {
    throw error;
  }
}

export async function updateTimeSlot(
  id: number,
  data: Partial<TimeSlotFormData>
): Promise<TimeSlot> {
  const path = `${API_BASE_PATH}/time-slots/${id}/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, {
      method: "PATCH", // Or PUT if you prefer full updates
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to update time slot. Status: ${res.status}`
      );
    return res.json() as Promise<TimeSlot>;
  } catch (error) {
    throw error;
  }
}

export async function deleteTimeSlot(id: number): Promise<void> {
  const path = `${API_BASE_PATH}/time-slots/${id}/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok && res.status !== 204)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to delete time slot. Status: ${res.status}`
      );
  } catch (error) {
    throw error;
  }
}

// Improved debugging version of fetchClassTimetables
export async function fetchClassTimetables(
  params: FetchClassTimetablesParams
): Promise<PaginatedClassTimetablesResponse> {
  const path = `${API_BASE_PATH}/class-timetables/`;
  const queryParams: Record<string, any> = { ...params };

  // Clean up query parameters
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );

  const url = buildUrl(path, queryParams);
  console.log("API Request URL:", url); // Log the exact URL being called
  console.log("API Query Params:", queryParams); // Log the exact parameters

  try {
    const res = await authFetch(url);
    console.log("API Response Status:", res.status); // Log response status

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("API Error Response:", errorData); // Log error details
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch class timetables. Status: ${res.status}`
      );
    }

    const data = await res.json();
    console.log("API Response Data Count:", data.count); // Log the count of results
    return data as PaginatedClassTimetablesResponse;
  } catch (error) {
    console.error("API Call Exception:", error);
    throw error;
  }
}

export async function fetchClassTimetableDetail( // Fetches a ClassTimetable with its entries (slots) and scheduled subjects
  id: number
): Promise<ClassTimetable> {
  const path = `${API_BASE_PATH}/class-timetables/${id}/schedule-grid/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url);
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to fetch class timetable detail. Status: ${res.status}`
      );
    return res.json() as Promise<ClassTimetable>;
  } catch (error) {
    throw error;
  }
}

export async function createClassTimetable(
  data: ClassTimetableFormData
): Promise<ClassTimetable> {
  const path = `${API_BASE_PATH}/class-timetables/`;
  const url = buildUrl(path);
  const payload = {
    ...data,
    school_class_id: Number(data.school_class_id),
    academic_year_id: Number(data.academic_year_id),
  };
  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to create class timetable. Status: ${res.status}`
      );
    return res.json() as Promise<ClassTimetable>;
  } catch (error) {
    throw error;
  }
}

export async function updateClassTimetable(
  id: number,
  data: Partial<ClassTimetableFormData>
): Promise<ClassTimetable> {
  const path = `${API_BASE_PATH}/class-timetables/${id}/`;
  const url = buildUrl(path);
  const payload = { ...data };
  if (payload.school_class_id)
    payload.school_class_id = Number(payload.school_class_id);
  if (payload.academic_year_id)
    payload.academic_year_id = Number(payload.academic_year_id);
  try {
    const res = await authFetch(url, {
      method: "PATCH", // Or PUT
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to update class timetable. Status: ${res.status}`
      );
    return res.json() as Promise<ClassTimetable>;
  } catch (error) {
    throw error;
  }
}

export async function deleteClassTimetable(id: number): Promise<void> {
  const path = `${API_BASE_PATH}/class-timetables/${id}/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok && res.status !== 204)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to delete class timetable. Status: ${res.status}`
      );
  } catch (error) {
    throw error;
  }
}

export async function setClassTimetableActive(id: number): Promise<void> {
  const path = `${API_BASE_PATH}/class-timetables/${id}/set-active/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, { method: "POST" });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to set timetable active. Status: ${res.status}`
      );
  } catch (error) {
    throw error;
  }
}

// --- TimetableEntry (Slot) API Functions (MODIFIED) ---

// Fetch list of TimetableEntry (slots) for a given ClassTimetable
export async function fetchTimetableEntries( // New function, if needed for listing slots directly
  params: FetchTimetableEntriesParams
): Promise<PaginatedTimetableEntriesResponse> {
  const path = `${API_BASE_PATH}/timetable-entries/`;
  const queryParams: Record<string, any> = { ...params };
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );
  const url = buildUrl(path, queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok)
      throw new Error(
        `Failed to fetch timetable entries. Status: ${res.status}`
      );
    return res.json() as Promise<PaginatedTimetableEntriesResponse>;
  } catch (error) {
    throw error;
  }
}

export async function createTimetableEntry( // Creates a "slot"
  data: TimetableEntryFormData
): Promise<TimetableEntry> {
  const path = `${API_BASE_PATH}/timetable-entries/`;
  const url = buildUrl(path);
  const payload = {
    ...data,
    time_slot_id: Number(data.time_slot_id),
    // class_subject_id and teacher_id are removed from TimetableEntryFormData
  };
  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to create timetable entry (slot). Status: ${res.status}`
      );
    return res.json() as Promise<TimetableEntry>; // Returns the created slot, possibly with empty scheduled_subjects
  } catch (error) {
    throw error;
  }
}

export async function updateTimetableEntry( // Updates a "slot"
  id: number,
  data: Partial<TimetableEntryFormData>
): Promise<TimetableEntry> {
  const path = `${API_BASE_PATH}/timetable-entries/${id}/`;
  const url = buildUrl(path);
  const payload: Partial<TimetableEntryFormData> = { ...data };
  if (payload.time_slot_id) payload.time_slot_id = Number(payload.time_slot_id);
  // Other fields like class_subject_id, teacher_id are not part of slot update

  try {
    const res = await authFetch(url, {
      method: "PATCH", // Or PUT
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to update timetable entry (slot). Status: ${res.status}`
      );
    return res.json() as Promise<TimetableEntry>;
  } catch (error) {
    throw error;
  }
}

export async function deleteTimetableEntry(id: number): Promise<void> {
  // Deletes a "slot" and its scheduled subjects (cascade)
  const path = `${API_BASE_PATH}/timetable-entries/${id}/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok && res.status !== 204)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to delete timetable entry (slot). Status: ${res.status}`
      );
  } catch (error) {
    throw error;
  }
}

// --- ScheduledClassSubject API Functions (NEW) ---
export async function fetchScheduledClassSubjects(
  params: FetchScheduledClassSubjectsParams
): Promise<PaginatedScheduledClassSubjectsResponse> {
  const path = `${API_BASE_PATH}/scheduled-class-subjects/`;
  const queryParams: Record<string, any> = { ...params };
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );
  const url = buildUrl(path, queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok)
      throw new Error(
        `Failed to fetch scheduled class subjects. Status: ${res.status}`
      );
    return res.json() as Promise<PaginatedScheduledClassSubjectsResponse>;
  } catch (error) {
    throw error;
  }
}

export async function createScheduledClassSubject( // Schedules a subject into a slot
  data: ScheduledClassSubjectFormData
): Promise<ScheduledClassSubject> {
  const path = `${API_BASE_PATH}/scheduled-class-subjects/`;
  const url = buildUrl(path);
  const payload = {
    ...data,
    timetable_entry_id: Number(data.timetable_entry_id),
    class_subject_id: Number(data.class_subject_id),
  };
  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to schedule subject in slot. Status: ${res.status}`
      );
    return res.json() as Promise<ScheduledClassSubject>;
  } catch (error) {
    throw error;
  }
}

export async function deleteScheduledClassSubject(id: number): Promise<void> {
  // Unschedules a subject from a slot
  const path = `${API_BASE_PATH}/scheduled-class-subjects/${id}/`;
  const url = buildUrl(path);
  try {
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok && res.status !== 204)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to unschedule subject from slot. Status: ${res.status}`
      );
  } catch (error) {
    throw error;
  }
}

// --- Multi-Period and Custom Views (MODIFIED) ---
export async function createMultiPeriodTimetableEntries( // FormData changed, return type changed
  data: MultiPeriodEntryFormData
): Promise<ScheduledClassSubject[]> {
  // Now returns an array of the scheduled items
  const path = `${API_BASE_PATH}/timetable-entries/bulk-add-multi-period/`;
  const url = buildUrl(path);
  const payload = {
    ...data,
    start_time_slot_id: Number(data.start_time_slot_id),
    class_subject_id: Number(data.class_subject_id),
    // teacher_id removed
  };
  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to create multi-period entries. Status: ${res.status}`
      );
    // Backend now returns a list of ScheduledClassSubject instances
    return res.json() as Promise<ScheduledClassSubject[]>;
  } catch (error) {
    throw error;
  }
}

export async function fetchTeacherSchedule( // Return type changed
  params: FetchTeacherScheduleParams
): Promise<TeacherScheduleEntry[]> {
  // Uses the new TeacherScheduleEntry type
  const path = `${API_BASE_PATH}/teacher-schedules/`;
  const queryParams: Record<string, any> = { ...params, page_size: 1000 };
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );
  const url = buildUrl(path, queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to fetch teacher schedule. Status: ${res.status}`
      );
    return res.json() as Promise<TeacherScheduleEntry[]>;
  } catch (error) {
    throw error;
  }
}

export async function fetchClassActiveSchedule( // No change in signature or immediate return type (ClassTimetable)
  params: FetchClassActiveScheduleParams
): Promise<ClassTimetable> {
  const path = `${API_BASE_PATH}/class-active-schedules/`;
  const queryParams: Record<string, any> = { ...params };
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );
  const url = buildUrl(path, queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok)
      throw new Error(
        getBackendErrorMessage(await res.json().catch(() => ({}))) ||
          `Failed to fetch class active schedule. Status: ${res.status}`
      );
    // The structure of the returned ClassTimetable.entries will be different (nested scheduled_subjects)
    return res.json() as Promise<ClassTimetable>;
  } catch (error) {
    throw error;
  }
}

// --- Fetch Student's Individual Schedule ---
export async function fetchStudentTimetable(
  params: FetchStudentTimetableParams
): Promise<StudentTimetableResponse> {
  const path = `${API_BASE_PATH}/student-schedules/`; // Matches the new backend URL
  const queryParams: Record<string, any> = { ...params };

  // Ensure IDs are strings for URL parameters if they might be numbers
  if (queryParams.student_id)
    queryParams.student_id = String(queryParams.student_id);
  if (queryParams.academic_year_id)
    queryParams.academic_year_id = String(queryParams.academic_year_id);

  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );

  const url = buildUrl(path, queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch student timetable. Status: ${res.status}`
      );
    }
    return res.json() as Promise<StudentTimetableResponse>;
  } catch (error) {
    console.error("Error in fetchStudentTimetable:", error);
    throw error;
  }
}
