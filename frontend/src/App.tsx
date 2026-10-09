import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }
        return response.json();
      })
      .then((data) => {
        setBackendStatus(data.status);
      })
      .catch(() => {
        setBackendStatus("Connection failed");
      });
  }, []);

  return (
    <main>
      <h1>StyleVerse AI</h1>
      <h2>3D Fashion Designer</h2>

      <p>Design your fashion ideas with AI and 3D technology.</p>

      <p>
        Backend Status: <strong>{backendStatus}</strong>
      </p>
    </main>
  );
}

export default App;
