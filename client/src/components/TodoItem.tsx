import React, { useState } from "react";
import type { Todo } from "../types/Todo";
import { BASE_URL } from "../App";
import { useAuth } from "../hooks/useAuth";
import AuthGateModal from "./AuthGateModal";
import {
  addWishlistId,
  removeWishlistId,
  getWishlistIds,
} from "../utils/wishlistCache";
import { markNoStarEndpoint, hasNoStarEndpoint } from "../utils/apiCompat";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (
    id: string,
    updates: Partial<Pick<Todo, "body" | "priority" | "dueDate" | "starred">>
  ) => Promise<void>;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onEdit,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { token } = useAuth();
  const [editText, setEditText] = useState(todo.body);
  const [editPriority, setEditPriority] = useState<string>(
    todo.priority || "medium"
  );
  const [editDueDate, setEditDueDate] = useState<string>(
    todo.dueDate ? todo.dueDate.slice(0, 10) : ""
  );
  const [dateError, setDateError] = useState<string>("");
  const todayStr = new Date().toISOString().slice(0, 10);
  const [showGate, setShowGate] = useState(false);
  const userId =
    JSON.parse(localStorage.getItem("auth_user") || "{}")?._id || null;
  // Prefer server-side per-user starredBy array; only consider current user's membership
  const serverStarredBy = Array.isArray(todo.starredBy) ? todo.starredBy : [];
  const cachedStar = userId ? getWishlistIds(userId).has(todo._id) : false;
  // Only treat as starred for the current user (prevents seeing others' wishlist)
  const isStarred = Boolean(
    (userId && serverStarredBy.includes(userId)) || cachedStar
  );

  const handleToggle = async () => {
    if (!token) {
      setShowGate(true);
      return;
    }
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
    if (!token) {
      setShowGate(true);
      return;
    }
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
    if (!token) {
      setShowGate(true);
      return;
    }
    if (!onEdit) return setIsEditing(false);
    if (editDueDate && editDueDate < todayStr) {
      setDateError("Due date cannot be in the past");
      return;
    }
    try {
      await onEdit(todo._id, {
        body: editText,
        priority: editPriority,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      });
      setIsEditing(false);
      setDateError("");
    } catch (e) {
      // error already handled upstream
    }
  };

  const handleToggleStar = async () => {
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-login-modal"));
      return;
    }
    // prevent duplicate clicks
    if (isStarring) return;
    const desired = !isStarred;
    setIsStarring(true);
    let success = false;
    // Fast path: if we previously determined this host doesn't support the
    // per-user star endpoint, update the local cache immediately and skip
    // the network call.
    if (hasNoStarEndpoint(BASE_URL)) {
      try {
        if (desired) addWishlistId(todo._id, userId);
        else removeWishlistId(todo._id, userId);
        success = true;
      } finally {
        setIsStarring(false);
      }
    } else {
      try {
        const res = await fetch(`${BASE_URL}/todos/${todo._id}/star`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ starred: desired }),
        });
        // record status implicitly via res.ok checks below
        if (!res.ok) {
          console.warn("toggle star failed, status:", res.status);
          if (res.status === 401) {
            // token expired or missing: prompt login
            window.dispatchEvent(new CustomEvent("open-login-modal"));
          } else if (res.status === 403) {
            // Server indicates this endpoint isn't usable for this resource/host.
            // Fallback: mark host and update local per-user wishlist cache so the
            // user still gets the expected UX.
            console.warn("You don't have permission to modify this item (403)");
            try {
              markNoStarEndpoint(BASE_URL);
            } catch (e) {}
            // Update local cache as if the toggle succeeded and consider this a
            // success for the UI so we can optimistically reflect the change.
            success = true;
            if (desired) addWishlistId(todo._id, userId);
            else removeWishlistId(todo._id, userId);
          }
        } else {
          success = true;
        }
      } catch (e) {
        console.error("toggle star failed:", e);
      } finally {
        setIsStarring(false);
      }
    }

    if (!success) {
      // Don't apply optimistic local updates when the server rejected the change.
      // Refresh list to reflect authoritative state.
      window.dispatchEvent(new CustomEvent("todos-refetch"));
      return;
    }

    // Update per-user wishlist cache only and re-sync the list. Do not call the
    // generic onEdit/PATCH endpoint here to avoid accidental side-effects.
    if (desired) addWishlistId(todo._id, userId);
    else removeWishlistId(todo._id, userId);
    // Re-sync authoritative list
    window.dispatchEvent(new CustomEvent("todos-refetch"));
  };

  return (
    <div className="relative bg-base-100 border border-base-300 rounded-xl p-5 pr-16 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-base-200/70 transition-all duration-200 shadow">
      {/* Wishlist Star (visible only to logged-in users; per-user only) */}
      {token && (
        <button
          onClick={handleToggleStar}
          title={isStarred ? "Remove from wishlist" : "Add to wishlist"}
          className={`btn btn-circle btn-ghost absolute top-3 right-3 ${
            isStarred ? "text-warning" : "text-warning/70"
          } hover:text-warning hover:bg-warning/10 transition-transform duration-150 hover:scale-110`}
          disabled={isStarring}
        >
          {isStarring ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isStarred ? "currentColor" : "none"}
              stroke="currentColor"
              className={`w-5 h-5 ${
                isStarred ? "text-warning" : "text-warning/70"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.6a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.537a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.6a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          )}
        </button>
      )}
      {/* Todo Text */}
      <div className="sm:flex-1 w-full sm:w-auto pr-0 sm:pr-4 min-w-0">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 cursor-pointer">
            <input
              className="md:col-span-5 bg-base-100 text-base-content border border-base-300 rounded-xl px-3 py-2"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <select
              className="md:col-span-3 bg-base-100 text-base-content border border-base-300 rounded-xl px-3 py-2 w-full cursor-pointer"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              className="md:col-span-4 bg-base-100 text-base-content border border-base-300 rounded-xl px-3 py-2 w-full cursor-pointer"
              value={editDueDate}
              min={todayStr}
              onChange={(e) => {
                const v = e.target.value;
                setEditDueDate(v);
                if (v && v < todayStr)
                  setDateError("Due date cannot be in the past");
                else setDateError("");
              }}
            />
          </div>
        ) : (
          <div>
            <span
              className={`text-lg font-medium text-base-content break-words ${
                todo.completed ? "line-through opacity-60" : ""
              }`}
            >
              {todo.body}
            </span>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {todo.priority && (
                <span
                  className={`badge badge-sm ${
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
                <span className="badge badge-sm badge-outline badge-info">
                  <span className="mr-1 underline">Due</span>
                  {new Date(todo.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status + Actions */}
      <div className="w-full sm:w-auto flex items-center gap-3 sm:ml-3">
        <div className="shrink-0">
          {todo.completed ? (
            <span className="badge badge-success badge-lg font-semibold">
              DONE
            </span>
          ) : (
            <div className="bg-yellow-400 text-yellow-900 rounded-full px-3 py-1.5 shadow font-extrabold leading-tight text-[10px] sm:text-xs flex flex-col items-center justify-center min-w-[86px]">
              <span className="tracking-wide">IN</span>
              <span>PROGRESS</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3 shrink-0">
          {/* Edit Button (login required) */}
          <button
            onClick={() => {
              if (isEditing) return handleSave();
              if (!token) {
                setShowGate(true);
                return;
              }
              setIsEditing(true);
            }}
            className="btn btn-circle btn-outline btn-info"
            title={isEditing ? "Save" : "Edit"}
          >
            {isEditing ? (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-.39.242l-3 1a1 1 0 01-1.272-1.272l1-3a1 1 0 01.242-.39l7.364-7.364a1 1 0 011.414 0l2.006 2.006zM14 7l-2-2"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 010 2.828l-1.586 1.586-2.828-2.828L14.586 2.586a2 2 0 012.828 0z" />
                <path d="M3 14.25V17h2.75l8.086-8.086-2.75-2.75L3 14.25z" />
              </svg>
            )}
          </button>
          {isEditing && dateError && (
            <span className="text-error text-xs ml-2 self-center">
              {dateError}
            </span>
          )}
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

          {/* Delete Button (login required) */}
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
      {showGate && (
        <AuthGateModal
          onClose={() => setShowGate(false)}
          onLoginClick={() => {
            setShowGate(false);
            window.dispatchEvent(new CustomEvent("open-login-modal"));
          }}
        />
      )}
    </div>
  );
};

export default TodoItem;
