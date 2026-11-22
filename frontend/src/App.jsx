import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginAdmin from "./components/LoginAdmin";
import AdminDashboard from "./components/AdminDashboard";
import MapaPublico from "./components/MapaPublico";

function usarRutaHash() {
  const [ruta, setRuta] = useState(() => window.location.hash);

  useEffect(() => {
    const actualizar = () => setRuta(window.location.hash);
    window.addEventListener("hashchange", actualizar);
    return () => window.removeEventListener("hashchange", actualizar);
  }, []);

  return ruta;
}

function Contenido() {
  const { usuario, cargando } = useAuth();
  const ruta = usarRutaHash();

  if (ruta === "#/mapa-publico") {
    return <MapaPublico />;
  }

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
