import NavBar from "./components/nav";
import TodoList from "./components/todoLis";

// ใช้ environment variable หรือ fallback เป็น localhost
export const BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? "https://project-go-production-a31a.up.railway.app/api"
    : "http://localhost:4000/api");

console.log("Current mode:", import.meta.env.MODE);
console.log("Base URL:", BASE_URL);
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
