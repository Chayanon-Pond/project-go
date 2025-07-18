import React from "react";
import NavBar from "./components/nav";
import TodoList from "./components/todoLis";
function App() {
  return (
    <div className="min-h-screen bg-base-200 ">
      <NavBar />
      <TodoList />
      {/* Main content area */}
      <div className="container mx-auto p-4"></div>
    </div>
  );
}

export default App;
