import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginAdmin from "./components/LoginAdmin";
import AdminDashboard from "./components/AdminDashboard";

function Contenido() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="splash">
        <div className="splash-mark">SP</div>
        <div className="spinner" aria-label="Cargando" />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return usuario ? <AdminDashboard /> : <LoginAdmin />;
}

export default function App() {
  return (
    <AuthProvider>
      <Contenido />
    </AuthProvider>
  );
}
