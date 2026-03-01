import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";


window.addEventListener("error", (e) => {
  alert("JS Error: " + (e.error?.message || e.message));
});

window.addEventListener("unhandledrejection", (e: any) => {
  alert("Promise Error: " + (e.reason?.message || String(e.reason)));
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);