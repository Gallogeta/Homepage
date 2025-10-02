import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Cache invalidation: Contact form fix v3
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
