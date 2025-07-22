import NavBar from "./components/nav";
import TodoList from "./components/todoLis";

export const BASE_URL = "https://project-go-production-a31a.up.railway.app/api";

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
