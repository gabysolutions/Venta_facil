import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";

// ✅ DEBUG iOS: si Safari truena, te muestra el error en pantalla
window.addEventListener("error", (e) => {
  const msg = [
    `JS Error: ${e.message}`,
    e.filename ? `File: ${e.filename}` : "",
    e.lineno != null ? `Line: ${e.lineno}:${e.colno ?? ""}` : "",
    (e as any).error?.stack ? `Stack: ${(e as any).error.stack}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  alert(msg);
});

window.addEventListener("unhandledrejection", (e: any) => {
  const reason = e?.reason;
  const msg = [
    "Promise Error:",
    reason?.message ? reason.message : String(reason),
    reason?.stack ? `Stack: ${reason.stack}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  alert(msg);
});

// ✅ Evita null
const rootEl = document.getElementById("root");
if (!rootEl) {
  alert("No se encontró #root en el HTML");
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>
  );
}