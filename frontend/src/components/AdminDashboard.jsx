import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

const ESTADOS = [
  { id: "PENDIENTE", label: "Pendientes", className: "status-pending" },
  { id: "EN_PROCESO", label: "En proceso", className: "status-process" },
  { id: "COMPLETADO", label: "Completados", className: "status-done" },
  { id: "RECHAZADO", label: "Rechazados", className: "status-rejected" },
];

const formatearFecha = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AdminDashboard() {
  const { usuario, token, logout } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const [datosResumen, datosUsuarios] = await Promise.all([
        apiFetch("/api/admin/resumen", { token }),
        apiFetch("/api/admin/usuarios", { token }),
      ]);

      setResumen(datosResumen);
      setUsuarios(datosUsuarios.usuarios || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        return;
      }
      setError(err.message || "No se pudieron cargar los datos");
    } finally {
      setCargando(false);
    }
  }, [token, logout]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const conteoEstados = useMemo(() => {
    const mapa = {};
    (resumen?.reportes_por_estado || []).forEach((item) => {
      mapa[item.estado] = Number(item.total);
    });
    return mapa;
  }, [resumen]);

  const totalReportes = useMemo(
    () => Object.values(conteoEstados).reduce((total, valor) => total + valor, 0),
    [conteoEstados],
  );

  const totalCiudadanos = Number(resumen?.usuarios?.ciudadanos || 0);
  const totalUsuarios = Number(resumen?.usuarios?.total || 0);
  const categorias = Number(resumen?.categorias_activas || 0);

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">SP</div>
          <div>
            <strong>Monitoreo de Servicios Públicos</strong>
            <span>Los Mochis, Sinaloa</span>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="user-chip">
            <span className="user-avatar">
              {usuario?.nombre?.slice(0, 1).toUpperCase() || "A"}
            </span>
            <div>
              <strong>{usuario?.nombre}</strong>
              <span>{usuario?.rol}</span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Panel administrativo</p>
            <h1>Resumen general</h1>
            <p>Usuarios, estados y cobertura del sistema.</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={cargarDatos} disabled={cargando}>
              {cargando ? "Actualizando..." : "Actualizar datos"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        {cargando && !resumen ? (
            <div className="loading-panel">
              <div className="spinner" />
              <span>Cargando información...</span>
            </div>
          ) : (
          <>
            <section className="stats-grid" aria-label="Indicadores generales">
              <article className="stat-card">
                <span className="stat-label">Usuarios registrados</span>
                <strong className="stat-value">{totalUsuarios}</strong>
                <span className="stat-hint">Administradores y ciudadanos</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Ciudadanos</span>
                <strong className="stat-value">{totalCiudadanos}</strong>
                <span className="stat-hint">Cuentas con rol CIUDADANO</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Reportes de prueba</span>
                <strong className="stat-value">{totalReportes}</strong>
                <span className="stat-hint">Reportes registrados en el sistema</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Categorías activas</span>
                <strong className="stat-value">{categorias}</strong>
                <span className="stat-hint">Servicios públicos disponibles</span>
              </article>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Reportes por estado</h2>
                  <p>Distribución de los datos de prueba cargados.</p>
                </div>
              </div>
              <div className="status-grid">
                {ESTADOS.map((estado) => (
                  <div key={estado.id} className={`status-card ${estado.className}`}>
                    <span>{estado.label}</span>
                    <strong>{conteoEstados[estado.id] || 0}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Usuarios del sistema</h2>
                  <p>Control estricto de roles ADMIN y CIUDADANO.</p>
                </div>
                <span className="panel-count">{usuarios.length} usuarios</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((item) => (
                      <tr key={item.id_usuario}>
                        <td>
                          <div className="table-user">
                            <span className="user-avatar user-avatar-small">
                              {item.nombre?.slice(0, 1).toUpperCase()}
                            </span>
                            <span>{item.nombre}</span>
                          </div>
                        </td>
                        <td className="muted">{item.correo}</td>
                        <td>
                          <span className={`badge ${item.rol === "ADMIN" ? "badge-admin" : "badge-citizen"}`}>
                            {item.rol}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.activo ? "badge-active" : "badge-inactive"}`}>
                            {item.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="muted">{formatearFecha(item.fecha_registro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </>
        )}
      </main>

      <footer className="dashboard-footer">
        Monitoreo de Servicios Públicos · Los Mochis, Sinaloa · Fase 1
      </footer>
    </div>
  );
}
