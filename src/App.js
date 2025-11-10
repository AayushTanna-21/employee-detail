// src/App.js
import React, { useState } from "react";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import "./App.css";

function App() {
  const [route, setRoute] = useState("home"); // "home" or "form"

  return (
    <div>
      <NavBar route={route} onNavigate={setRoute} />
      <main style={{ padding: "20px" }}>
        {route === "home" && <Home />}
        {route === "form" && <FormPage />}
      </main>
    </div>
  );
}

export default App;
