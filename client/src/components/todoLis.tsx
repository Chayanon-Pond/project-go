import React, { useState, useEffect } from "react";
import type { Todo } from "../types/Todo";
import TodoItem from "./TodoItem";
import TodoInput from "./todoForm";

const API_BASE_URL = "http://localhost:4000/api";

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching todos from:", `${API_BASE_URL}/todos`);

      const response = await fetch(`${API_BASE_URL}/todos`);
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
  const handleAddTodo = async (body: string) => {
    try {
      console.log("Adding todo:", body);

      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
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
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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

  const handleDeleteTodo = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6 max-w-md">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 px-4 py-2 rounded-lg transition-all duration-200"
            onClick={fetchTodos}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-">
      <div className="container mx-auto px-4 py-8">
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
          {todos.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-2xl font-semibold mb-4 text-white">
                No tasks yet
              </h3>
              <p className="text-slate-400 text-lg">
                Add your first task above to get started!
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
              />
            ))
          )}
        </div>

        {/* Stats */}
        {todos.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {todos.length}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-wide">
                  Total Tasks
                </div>
              </div>
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">
                  {todos.filter((t) => t.completed).length}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-wide">
                  Completed
                </div>
              </div>
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {todos.filter((t) => !t.completed).length}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-wide">
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
