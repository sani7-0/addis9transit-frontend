import { useState } from "react";
import { createRoot } from "react-dom/client";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");

  if (!token) {
    return <AdminLogin onLogin={(t) => { localStorage.setItem("admin_token", t); setToken(t); }} />;
  }

  return <AdminDashboard onLogout={() => { localStorage.removeItem("admin_token"); setToken(""); }} />;
}

createRoot(document.getElementById("root")!).render(<AdminApp />);
