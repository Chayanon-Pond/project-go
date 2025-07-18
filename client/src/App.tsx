import React from "react";
import NavBar from "./components/nav";
import SearchBar from "./components/todoForm";

function App() {
  return (
    <div className="min-h-screen bg-base-200 ">
      <NavBar />
      <SearchBar />
      {/* Main content area */}
      <div className="container mx-auto p-4"></div>
    </div>
  );
}

export default App;
