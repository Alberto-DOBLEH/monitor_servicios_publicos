import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  exportarCSV,
  obtenerCategorias,
  obtenerGeo,
  obtenerReporte,
  obtenerReportesAdmin,
} from "../services/reportes";
import MapaReportes from "./MapaReportes";
import ReporteDetalle from "./ReporteDetalle";

const ESTADOS = [
  ["", "Todos los estados"],
  ["PENDIENTE", "Pendiente"],
  ["EN_PROCESO", "En proceso"],
  ["COMPLETADO", "Completado"],
  ["RECHAZADO", "Rechazado"],
  ["ARCHIVADO", "Archivado"],
];

const ETIQUETAS_ESTADO = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  RECHAZADO: "Rechazado",
  ARCHIVADO: "Archivado",
};

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

export default function PanelReportes({ onDatosActualizados }) {
  const { token, logout } = useAuth();

  const [geo, setGeo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    estado: "",
    categoria_id: "",
    buscar: "",
    fecha_desde: "",
    fecha_hasta: "",
  });
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [agrupar, setAgrupar] = useState(true);
  const [error, setError] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [datosGeo, datosCategorias] = await Promise.all([
        obtenerGeo(),
        obtenerCategorias(),
      ]);
      setGeo(datosGeo);
      setCategorias(datosCategorias.categorias || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los catálogos");
    }
  }, []);

  const cargarReportes = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerReportesAdmin(token, {
        ...filtros,
        limite: 200,
      });
      setReportes(datos.reportes || []);
      setTotal(Number(datos.total) || 0);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        return;
      }
      setError(err.message || "No se pudieron cargar los reportes");
    } finally {
      setCargando(false);
    }
  }, [token, filtros, logout]);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const cargarDetalle = useCallback(
    async (id) => {
      setCargandoDetalle(true);
      setDetalle(null);

      try {
        const datos = await obtenerReporte(id, token);
        setDetalle(datos);
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          logout();
          return;
        }
        setError(err.message || "No se pudo cargar el detalle");
      } finally {
        setCargandoDetalle(false);
      }
    },
    [token, logout],
  );

  const seleccionar = (reporte) => {
    setIdSeleccionado(reporte.id_reporte);
    cargarDetalle(reporte.id_reporte);
  };

  const cerrarDetalle = () => {
    setIdSeleccionado(null);
    setDetalle(null);
  };

  const trasActualizarEstado = async (datos) => {
    setDetalle({ reporte: datos.reporte, historial: datos.historial });
    await cargarReportes();
    onDatosActualizados?.();
  };

  const reporteSeleccionado = useMemo(
    () => reportes.find((r) => r.id_reporte === idSeleccionado) || null,
    [reportes, idSeleccionado],
  );

  const actualizarFiltro = (clave, valor) =>
    setFiltros((anteriores) => ({ ...anteriores, [clave]: valor }));

  const manejarExportar = async () => {
    setExportando(true);
    setError("");

    try {
      await exportarCSV(token, filtros);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        return;
      }
      setError(err.message || "No se pudo exportar el CSV");
    } finally {
      setExportando(false);
    }
  };

  return (
    <section className="panel reportes-panel">
      <div className="panel-head reportes-head">
        <div>
          <h2>Reportes ciudadanos</h2>
          <p>
            Puntos exactos en Los Mochis, filtros y ciclo de vida de cada reporte.
          </p>
        </div>
        <div className="reportes-contador">
          <strong>{total}</strong>
          <span>reportes</span>
        </div>
      </div>

      <div className="filtros-barra">
        <label className="filtro-campo">
          <span>Estado</span>
          <select
            value={filtros.estado}
            onChange={(e) => actualizarFiltro("estado", e.target.value)}
          >
            {ESTADOS.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>

        <label className="filtro-campo">
          <span>Servicio</span>
          <select
            value={filtros.categoria_id}
            onChange={(e) => actualizarFiltro("categoria_id", e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="filtro-campo filtro-buscar">
          <span>Buscar</span>
          <input
            type="search"
            value={filtros.buscar}
            onChange={(e) => actualizarFiltro("buscar", e.target.value)}
            placeholder="Folio o título"
          />
        </label>

        <label className="filtro-campo">
          <span>Desde</span>
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => actualizarFiltro("fecha_desde", e.target.value)}
          />
        </label>

        <label className="filtro-campo">
          <span>Hasta</span>
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => actualizarFiltro("fecha_hasta", e.target.value)}
          />
        </label>

        <div className="filtros-acciones">
          <button
            type="button"
            className={agrupar ? "btn btn-secondary btn-activo" : "btn btn-secondary"}
            onClick={() => setAgrupar((valor) => !valor)}
            title="Agrupar marcadores cercanos"
          >
            {agrupar ? "Puntos agrupados" : "Puntos individuales"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={cargarReportes}
            disabled={cargando}
          >
            {cargando ? "Cargando..." : "Actualizar"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={manejarExportar}
            disabled={exportando || total === 0}
          >
            {exportando ? "Exportando..." : "Exportar CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      <div className="reportes-layout">
        <div className="reportes-lista">
          {cargando && reportes.length === 0 ? (
            <div className="loading-panel">
              <div className="spinner" />
              <span>Cargando reportes...</span>
            </div>
          ) : reportes.length === 0 ? (
            <div className="estado-vacio">
              <strong>Sin reportes</strong>
              <span>No hay reportes que coincidan con los filtros.</span>
            </div>
          ) : (
            <div className="table-wrap tabla-reportes">
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Reporte</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.map((reporte) => (
                    <tr
                      key={reporte.id_reporte}
                      className={
                        idSeleccionado === reporte.id_reporte
                          ? "fila-seleccionada"
                          : ""
                      }
                      onClick={() => seleccionar(reporte)}
                    >
                      <td className="folio-celda">{reporte.folio}</td>
                      <td>
                        <div className="titulo-celda">
                          <strong>{reporte.titulo}</strong>
                          <small>{reporte.usuario?.nombre}</small>
                        </div>
                      </td>
                      <td>
                        <span className="categoria-celda">
                          <i
                            className="categoria-punto"
                            style={{ background: reporte.categoria?.color || "#94a3b8" }}
                          />
                          {reporte.categoria?.nombre}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge badge-estado estado-${reporte.estado.toLowerCase()}`}
                        >
                          {ETIQUETAS_ESTADO[reporte.estado] || reporte.estado}
                        </span>
                      </td>
                      <td className="muted">{formatearFecha(reporte.fecha_registro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="reportes-mapa">
          <MapaReportes
            geo={geo}
            reportes={reportes}
            seleccionado={reporteSeleccionado}
            onSeleccionar={seleccionar}
            agrupar={agrupar}
          />
        </div>
      </div>

      {(detalle || cargandoDetalle) && (
        <>
          <div className="drawer-backdrop" onClick={cerrarDetalle} />
          {detalle ? (
            <ReporteDetalle
              detalle={detalle}
              token={token}
              onCerrar={cerrarDetalle}
              onEstadoActualizado={trasActualizarEstado}
            />
          ) : (
            <aside className="detalle-drawer">
              <div className="detalle-body">
                <div className="loading-panel">
                  <div className="spinner" />
                  <span>Cargando detalle...</span>
                </div>
              </div>
            </aside>
          )}
        </>
      )}
    </section>
  );
}
