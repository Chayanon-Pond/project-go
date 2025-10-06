import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthGateModal from "./AuthGateModal";

interface TodoPayload {
  body: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}

interface TodoInputProps {
  onAddTodo?: (todo: TodoPayload) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
}

const TodoInput: React.FC<TodoInputProps> = ({
  onAddTodo,
  placeholder = "What needs to be done?",
  disabled = false,
}) => {
  const { token } = useAuth();
  const [showGate, setShowGate] = useState(false);
  const [todoText, setTodoText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [dateError, setDateError] = useState<string>("");
  const todayStr = new Date().toISOString().slice(0, 10);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTodoText(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!todoText.trim()) {
      return;
    }

    if (!token) {
      setShowGate(true);
      return;
    }

    // validate past date
    if (dueDate && dueDate < todayStr) {
      setDateError("Due date cannot be in the past");
      return;
    }

    setIsLoading(true);

    try {
      if (onAddTodo) {
        await onAddTodo({
          body: todoText.trim(),
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        });
        setTodoText("");
        setDueDate("");
        setDateError("");
      }
    } catch (error) {
      console.error("Error adding todo:", error);
      alert("Failed to add todo. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full mb-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <input
            type="text"
            value={todoText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="md:col-span-6 bg-base-100 text-base-content backdrop-blur-sm border border-base-300 rounded-xl px-6 py-4 text-lg placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-all duration-200"
            maxLength={500}
          />

          <div className="md:col-span-2 relative">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              disabled={disabled || isLoading}
              className="w-full bg-base-100 text-base-content border border-base-300 rounded-xl px-4 py-4 pr-10 appearance-none cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute top-1/2 transform -translate-y-1/2"
              style={{ right: "8px", zIndex: 0 }}
              aria-hidden
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              const v = e.target.value;
              setDueDate(v);
              if (v && v < todayStr)
                setDateError("Due date cannot be in the past");
              else setDateError("");
            }}
            disabled={disabled || isLoading}
            min={todayStr}
            className="md:col-span-3 bg-base-100 text-base-content border border-base-300 rounded-xl px-4 py-4 "
          />

          <button
            type="submit"
            disabled={!todoText.trim() || !!dateError || disabled || isLoading}
            className="md:col-span-2 btn btn-primary disabled:btn-disabled min-w-[120px] h-[52px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Add"
            )}
          </button>
        </div>

        <div className="flex justify-between items-center mt-3 px-2">
          <div className="text-sm text-slate-400">
            Press Enter or click "Add" to create a new task
          </div>
          <div className="text-sm text-slate-400">{todoText.length}/500</div>
        </div>

        {dateError && (
          <div className="mt-2 px-2 text-sm text-error">{dateError}</div>
        )}
      </form>

      {showGate && (
        <AuthGateModal
          onClose={() => setShowGate(false)}
          onLoginClick={() => {
            setShowGate(false);
            // trigger existing login modal by dispatching a custom event consumed by Nav
            window.dispatchEvent(new CustomEvent("open-login-modal"));
          }}
        />
      )}
    </div>
  );
};

export default TodoInput;
