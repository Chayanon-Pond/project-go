import React, { useEffect } from "react";
import TodoList from "../components/todoLis";
import BackButton from "../components/BackButton";
import { useAuth } from "../hooks/useAuth";

const WishlistPage: React.FC = () => {
  const { token } = useAuth();
  useEffect(() => {
    if (!token) {
      window.dispatchEvent(new CustomEvent("open-login-modal"));
    }
  }, [token]);
  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <BackButton to="/" />
      </div>
      <TodoList starredOnly />
    </div>
  );
};

export default WishlistPage;
