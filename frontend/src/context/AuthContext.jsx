import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../services/api";

const TOKEN_KEY = "msp_admin_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [cargando, setCargando] = useState(true);

  const limpiarSesion = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    let activo = true;

    const restaurarSesion = async () => {
      const tokenGuardado = sessionStorage.getItem(TOKEN_KEY);

      if (!tokenGuardado) {
        if (activo) setCargando(false);
        return;
      }

      try {
        const datos = await apiFetch("/api/auth/me", { token: tokenGuardado });

        if (datos?.usuario?.rol !== "ADMIN") {
          limpiarSesion();
          return;
        }

        if (activo) {
          setUsuario(datos.usuario);
          setToken(tokenGuardado);
        }
      } catch {
        limpiarSesion();
      } finally {
        if (activo) setCargando(false);
      }
    };

    restaurarSesion();

    return () => {
      activo = false;
    };
  }, [limpiarSesion]);

  const login = useCallback(async (correo, password) => {
    const datos = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo, password }),
    });

    if (datos?.usuario?.rol !== "ADMIN") {
      throw new Error(
        "Esta plataforma web es solo para administradores. Usa la app móvil para reportar como ciudadano.",
      );
    }

    sessionStorage.setItem(TOKEN_KEY, datos.token);
    setToken(datos.token);
    setUsuario(datos.usuario);

    return datos.usuario;
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      token,
      cargando,
      login,
      logout: limpiarSesion,
      autenticado: Boolean(usuario && token),
    }),
    [usuario, token, cargando, login, limpiarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return contexto;
}
