export interface Todo {
  _id: string;
  body: string;
  completed: boolean;
  priority?: "low" | "medium" | "high" | string;
  dueDate?: string | null; // ISO string from backend
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}