import React, { useState } from "react";

interface TodoInputProps {
  onAddTodo?: (todoText: string) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
}

const TodoInput: React.FC<TodoInputProps> = ({
  onAddTodo,
  placeholder = "What needs to be done?",
  disabled = false,
}) => {
  const [todoText, setTodoText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTodoText(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!todoText.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      if (onAddTodo) {
        await onAddTodo(todoText.trim());
        setTodoText("");
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
        <div className="flex gap-4">
          <input
            type="text"
            value={todoText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="flex-1 bg-base-100 backdrop-blur-sm border border-slate-600/30 rounded-xl px-6 py-4 text-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200"
            maxLength={500}
          />

          <button
            type="submit"
            disabled={!todoText.trim() || disabled || isLoading}
            className="bg-base-100 from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 min-w-[120px] flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "+"
            )}
          </button>
        </div>

        <div className="flex justify-between items-center mt-3 px-2">
          <div className="text-sm text-slate-400">
            Press Enter or click "Add Task" to create a new task
          </div>
          <div className="text-sm text-slate-400">{todoText.length}/500</div>
        </div>
      </form>
    </div>
  );
};

export default TodoInput;
