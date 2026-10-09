import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import DesignStudio from "./pages/DesignStudio";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="bg-white shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <Link
            to="/"
            className="text-2xl font-bold text-pink-700 no-underline"
          >
            StyleVerse AI
          </Link>

          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="font-medium text-gray-700 no-underline hover:text-pink-700"
            >
              Home
            </Link>

            <Link
              to="/studio"
              className="font-medium text-gray-700 no-underline hover:text-pink-700"
            >
              Design Studio
            </Link>
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<DesignStudio />} />
      </Routes>
    </div>
  );
}

export default App;
