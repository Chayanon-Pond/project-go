import React, { useState, useEffect, useMemo } from "react";
import type { Todo } from "../types/Todo";
import TodoItem from "./TodoItem";
import TodoInput from "./todoForm";
import { BASE_URL } from "../App";
import { useAuth } from "../hooks/useAuth";

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "completed">("all");
  const [priority, setPriority] = useState<string>("");
  const [sort, setSort] = useState<"createdDesc" | "createdAsc" | "dueAsc" | "dueDesc">("createdDesc");
  const { token } = useAuth();

  // debounce search to reduce API calls while typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchTodos();
  }, [debouncedSearch, status, priority]);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
  if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);
      if (priority) params.set("priority", priority);

  const qs = params.toString();
  const url = qs ? `${BASE_URL}/todos?${qs}` : `${BASE_URL}/todos`;
  console.log("Fetching todos from:", url);

  const response = await fetch(url,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw response data:", data);

      setTodos(data || []);
    } catch (err: any) {
      console.error("Error fetching todos:", err);
      setError(
        `Failed to load todos: ${err?.message || err || "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side fallback filtering to ensure UX even if server doesn't filter
  const visibleTodos = useMemo(() => {
    let list = [...todos];
    const q = debouncedSearch.toLowerCase();
    if (q) list = list.filter((t) => t.body.toLowerCase().includes(q));
    if (status !== "all") {
      list = list.filter((t) => (status === "completed" ? t.completed : !t.completed));
    }
    if (priority) list = list.filter((t) => (t.priority || "").toLowerCase() === priority.toLowerCase());
    // sorting
    list.sort((a, b) => {
      const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const byCreated = () => (cb - ca);
      const byCreatedAsc = () => (ca - cb);
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      if (sort === "createdDesc") return byCreated();
      if (sort === "createdAsc") return byCreatedAsc();
      if (sort === "dueAsc") return da - db;
      return db - da; // dueDesc
    });
    return list;
  }, [todos, debouncedSearch, status, priority, sort]);
  const handleAddTodo = async (payload: { body: string; priority?: string; dueDate?: string | null }) => {
    try {
      console.log("Adding todo:", payload);

    const response = await fetch(`${BASE_URL}/todos`, {
        method: "POST",
        headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      console.log("Add todo response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create todo");
      }

      const newTodo = await response.json();
      console.log("New todo created:", newTodo);

      setTodos((prev) => [...prev, newTodo]);
    } catch (err) {
      console.error("Error adding todo:", err);
      throw err;
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
    const response = await fetch(`${BASE_URL}/todos/${id}`, {
        method: "PATCH",
        headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // empty body triggers toggle on backend
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to update todo");
      }

      // Update local state
      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
    } catch (err: any) {
      console.error("Error toggling todo:", err);
      alert("Failed to update todo");
      throw err;
    }
  };

  const handleEditTodo = async (id: string, updates: Partial<Pick<Todo, "body" | "priority" | "dueDate">>) => {
    try {
      const response = await fetch(`${BASE_URL}/todos/${id}`, {
        method: "PATCH",
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to edit todo");
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
      );
    } catch (err) {
      console.error("Error editing todo:", err);
      alert("Failed to edit todo");
      throw err;
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/todos/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }

      // Update local state
      setTodos((prev) => prev.filter((todo) => todo._id !== id));
    } catch (err) {
      console.error("Error deleting todo:", err);
      alert("Failed to delete todo");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Inline error banner (keep inputs focusable) */}
        {error && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-red-500/15 border border-red-400/30 text-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <span>{error}</span>
              <button
                className="bg-red-400/20 hover:bg-red-400/30 text-red-100 px-3 py-1 rounded-md"
                onClick={fetchTodos}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:col-span-6 bg-base-100 text-base-content border border-base-300 rounded-xl px-4 py-3"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="md:col-span-3 bg-base-100 text-base-content border border-base-300 rounded-xl px-4 py-3"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="md:col-span-3 bg-base-100 text-base-content border border-base-300 rounded-xl px-4 py-3"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="md:col-span-3 bg-base-100 text-base-content border border-base-300 rounded-xl px-4 py-3"
            >
              <option value="createdDesc">Newest</option>
              <option value="createdAsc">Oldest</option>
              <option value="dueAsc">Due soon</option>
              <option value="dueDesc">Due last</option>
            </select>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm">
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block" />
              Updating list...
            </div>
          )}
        </div>

        {/* Add Todo Input */}
        <div className="max-w-4xl mx-auto mb-8">
          <TodoInput onAddTodo={handleAddTodo} />
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4 tracking-wider">
            TODAY'S TASKS
          </h1>
        </div>

        {/* Todo List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {visibleTodos.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                className="btn btn-xs btn-outline btn-error"
                onClick={async () => {
                  // optimistic: remove completed locally; best-effort delete one by one
                  const completed = todos.filter(t => t.completed);
                  for (const t of completed) {
                    try { await handleDeleteTodo(t._id); } catch {}
                  }
                }}
              >
                Clear completed
              </button>
            </div>
          )}
          {visibleTodos.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-2xl font-semibold mb-4 text-base-content">
                No tasks yet
              </h3>
              <p className="text-base-content/60 text-lg">
                Add your first task above to get started!
              </p>
            </div>
          ) : (
            visibleTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onEdit={handleEditTodo}
              />
            ))
          )}
        </div>

        {/* Stats */}
  {visibleTodos.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-base-100 border border-base-300 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-base-content mb-2">
      {visibleTodos.length}
                </div>
                <div className="text-base-content/60 text-sm uppercase tracking-wide">
                  Total Tasks
                </div>
              </div>
              <div className="bg-base-100 border border-base-300 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-info mb-2">
      {visibleTodos.filter((t) => t.completed).length}
                </div>
                <div className="text-base-content/60 text-sm uppercase tracking-wide">
                  Completed
                </div>
              </div>
              <div className="bg-base-100 border border-base-300 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-warning mb-2">
      {visibleTodos.filter((t) => !t.completed).length}
                </div>
                <div className="text-base-content/60 text-sm uppercase tracking-wide">
                  Remaining
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
