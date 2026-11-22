import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginAdmin() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState("admin@servicios.test");
  const [password, setPassword] = useState("Admin123!");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      await login(correo.trim(), password);
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <div className="brand-mark brand-mark-large">SP</div>
        <p className="eyebrow">Los Mochis, Sinaloa</p>
        <h1>Monitoreo de Servicios Públicos</h1>
        <p className="auth-brand-copy">
          Plataforma municipal para dar seguimiento a reportes ciudadanos de alumbrado,
          baches, drenaje, agua potable, basura y más.
        </p>

        <div className="brand-points">
          <div>
            <span className="point-dot" />
            <span>Panel administrativo con roles y permisos</span>
          </div>
          <div>
            <span className="point-dot" />
            <span>Seguimiento del ciclo de vida de cada reporte</span>
          </div>
          <div>
            <span className="point-dot" />
            <span>Reportes geolocalizados desde la app móvil</span>
          </div>
        </div>

        <div className="brand-footer">
          <span>Fase 4</span>
          <span>Mapa público, CSV y seguimiento</span>
        </div>
      </section>

      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <p className="eyebrow">Acceso administrativo</p>
          <h2>Iniciar sesión</h2>
          <p className="auth-form-subtitle">
            Ingresa con una cuenta con rol <strong>Administrador</strong>.
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="form">
            <label className="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="admin@servicios.test"
                autoComplete="username"
                required
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <div className="password-row">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <button type="submit" className="btn btn-primary btn-block" disabled={cargando}>
              {cargando ? "Verificando..." : "Entrar al panel"}
            </button>
          </form>

          <div className="demo-box">
            <div className="demo-box-title">Credenciales de prueba</div>
            <div className="demo-row">
              <span>Administrador</span>
              <code>admin@servicios.test / Admin123!</code>
            </div>
            <div className="demo-row">
              <span>Ciudadano</span>
              <code>ciudadano1@servicios.test / Ciudadano123!</code>
            </div>
            <p className="demo-note">
              La cuenta de ciudadano se usa en la app móvil de Android, no en esta web.
            </p>
          </div>

          <a className="login-public-link" href="#/mapa-publico">
            Ver mapa público de reportes →
          </a>
        </div>

        <p className="legal-note">
          Monitoreo de Servicios Públicos · Los Mochis, Sinaloa · Fase 4
        </p>
      </section>
    </main>
  );
}
