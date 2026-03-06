
import { Navigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function RootRedirect() {
  const token = getToken();
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}