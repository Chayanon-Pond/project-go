export interface Todo {
  _id: string;
  body: string;
  completed: boolean;
  starred?: boolean;
  starredBy?: string[]; // array of user IDs who starred this todo
  priority?: "low" | "medium" | "high" | string;
  dueDate?: string | null; // ISO string from backend
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}