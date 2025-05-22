export interface ActivityLog {
  id: number;
  activity: string;
  timestamp: string;
  user: string; // Username or "System"
  action: "CREATE" | "UPDATE" | "DELETE";
  model_name: string;
  object_id: number;
}
