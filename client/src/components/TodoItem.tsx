import React, { useState } from "react";
import type { Todo } from "../types/Todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(todo._id);
    } catch (error) {
      console.error("Error toggling todo:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(todo._id);
    } catch (error) {
      console.error("Error deleting todo:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 flex items-center justify-between group hover:bg-slate-600/50 transition-all duration-200 shadow-lg">
      {/* Todo Text */}
      <div className="flex-1 pr-4">
        <span
          className={`text-lg font-medium ${
            todo.completed ? "line-through text-slate-400" : "text-white"
          }`}
        >
          {todo.body}
        </span>
      </div>

      {/* Status Badge */}
      <div className="mr-6">
        {todo.completed ? (
          <span className="bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide">
            DONE
          </span>
        ) : (
          <span className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-lg text-sm font-semibold tracking-wide">
            IN PROGRESS
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Toggle Complete Button */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/40 border border-green-400/30 flex items-center justify-center transition-all duration-200 group"
          title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {isToggling ? (
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 flex items-center justify-center transition-all duration-200"
          title="Delete todo"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default TodoItem;
