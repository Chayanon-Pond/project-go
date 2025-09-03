import React, { useState } from "react";
import type { Todo } from "../types/Todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (id: string, updates: Partial<Pick<Todo, "body" | "priority" | "dueDate">>) => Promise<void>;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onEdit }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.body);
  const [editPriority, setEditPriority] = useState<string>(todo.priority || "medium");
  const [editDueDate, setEditDueDate] = useState<string>(todo.dueDate ? todo.dueDate.slice(0, 10) : "");

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

  const handleSave = async () => {
    if (!onEdit) return setIsEditing(false);
    try {
      await onEdit(todo._id, {
        body: editText,
        priority: editPriority,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      });
      setIsEditing(false);
    } catch (e) {
      // error already handled upstream
    }
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5 flex items-center justify-between group hover:bg-base-200/70 transition-all duration-200 shadow">
      {/* Todo Text */}
      <div className="flex-1 pr-4">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              className="md:col-span-6 bg-base-100 text-base-content border border-base-300 rounded-xl px-3 py-2"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <select
              className="md:col-span-2 bg-base-100 text-base-content border border-base-300 rounded-xl px-3 py-2"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              className="md:col-span-2 bg-base-100 text-base-content border border-base-300 rounded-xl px-3 py-2"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <span
              className={`text-lg font-medium text-base-content ${
                todo.completed ? "line-through opacity-60" : ""
              }`}
            >
              {todo.body}
            </span>
            <div className="mt-2 flex gap-2 text-xs">
              {todo.priority && (
                <span
                  className={`badge badge-outline ${
                    todo.priority === "high"
                      ? "badge-error"
                      : todo.priority === "medium"
                      ? "badge-warning"
                      : "badge-success"
                  }`}
                >
                  {String(todo.priority).toUpperCase()}
                </span>
              )}
              {todo.dueDate && (
                <span className="badge badge-outline badge-info">
                  Due {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mr-6">
        {todo.completed ? (
          <span className="badge badge-success badge-lg font-semibold">
            DONE
          </span>
        ) : (
          <span className="badge badge-warning badge-lg font-semibold">
            IN PROGRESS
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {/* Edit Button */}
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="btn btn-circle btn-outline btn-info"
          title={isEditing ? "Save" : "Edit"}
        >
          {isEditing ? (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-.39.242l-3 1a1 1 0 01-1.272-1.272l1-3a1 1 0 01.242-.39l7.364-7.364a1 1 0 011.414 0l2.006 2.006zM14 7l-2-2" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 010 2.828l-1.586 1.586-2.828-2.828L14.586 2.586a2 2 0 012.828 0z" />
              <path d="M3 14.25V17h2.75l8.086-8.086-2.75-2.75L3 14.25z" />
            </svg>
          )}
        </button>
        {/* Toggle Complete Button */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="btn btn-circle btn-outline btn-success"
          title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {isToggling ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-5 h-5"
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
          className="btn btn-circle btn-outline btn-error"
          title="Delete todo"
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-5 h-5"
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
