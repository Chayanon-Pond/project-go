import NavBar from "./components/nav";
import TodoList from "./components/todoLis";

// ใช้ environment variable หรือ fallback เป็น localhost
// Prefer an explicit VITE_API_URL, but when running the client from localhost
// prefer the local backend so you'll hit your dev server instead of prod.
const envUrl = import.meta.env.VITE_API_URL;
const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Runtime selection: if you're on localhost prefer the local backend so dev
// testing talks to your local server even if .env has VITE_API_URL set to prod.
let runtimeBase = '';
if (isLocalHost) {
  // prefer local backend during development/testing
  runtimeBase = 'http://localhost:4000/api';
} else if (import.meta.env.MODE === 'production') {
  runtimeBase = 'https://project-go-production-a31a.up.railway.app/api';
} else {
  runtimeBase = 'http://localhost:4000/api';
}

export const BASE_URL = envUrl && !isLocalHost ? envUrl : runtimeBase;

console.log("Current mode:", import.meta.env.MODE);
console.log("Base URL:", BASE_URL, "(VITE_API_URL?", !!envUrl, ")");
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
