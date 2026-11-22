import React, { useMemo, useState } from "react";
import { cambiarEstadoReporte } from "../services/reportes";

const TRANSICIONES = {
  PENDIENTE: ["EN_PROCESO", "RECHAZADO", "ARCHIVADO"],
  EN_PROCESO: ["COMPLETADO", "RECHAZADO", "ARCHIVADO"],
  COMPLETADO: ["ARCHIVADO"],
  RECHAZADO: ["ARCHIVADO"],
  ARCHIVADO: [],
};

const ETIQUETAS_ESTADO = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  RECHAZADO: "Rechazado",
  ARCHIVADO: "Archivado",
};

const formatearFecha = (valor, conHora = false) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

export default function ReporteDetalle({
  detalle,
  token,
  onCerrar,
  onEstadoActualizado,
}) {
  const { reporte, historial } = detalle;
  const [estado, setEstado] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const opciones = useMemo(
    () => TRANSICIONES[reporte?.estado] || [],
    [reporte?.estado],
  );

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");

    if (!estado) {
      setError("Selecciona el nuevo estado");
      return;
    }

    setCargando(true);

    try {
      const datos = await cambiarEstadoReporte(
        reporte.id_reporte,
        { estado, comentario: comentario.trim() || undefined },
        token,
      );
      setEstado("");
      setComentario("");
      onEstadoActualizado(datos);
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado");
    } finally {
      setCargando(false);
    }
  };

  return (
    <aside className="detalle-drawer" aria-label="Detalle del reporte">
      <div className="detalle-head">
        <div>
          <span className="eyebrow">{reporte.folio}</span>
          <h2>{reporte.titulo}</h2>
        </div>
        <button
          type="button"
          className="icono-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
        >
          ×
        </button>
      </div>

      <div className="detalle-body">
        <div className="detalle-meta">
          <span className={`badge badge-estado estado-${reporte.estado.toLowerCase()}`}>
            {ETIQUETAS_ESTADO[reporte.estado] || reporte.estado}
          </span>
          <span className="badge badge-categoria">
            {reporte.categoria?.nombre}
          </span>
          <span className="badge badge-prioridad">
            Prioridad {reporte.prioridad?.toLowerCase()}
          </span>
        </div>

        {reporte.descripcion && (
          <div className="detalle-bloque">
            <h3>Descripción</h3>
            <p>{reporte.descripcion}</p>
          </div>
        )}

        <div className="detalle-bloque">
          <h3>Ubicación</h3>
          <p>
            {reporte.direccion_referencia || "Sin referencia de dirección"}
          </p>
          <div className="coordenadas">
            <span>
              Lat <strong>{Number(reporte.latitud).toFixed(6)}</strong>
            </span>
            <span>
              Lng <strong>{Number(reporte.longitud).toFixed(6)}</strong>
            </span>
          </div>
        </div>

        <div className="detalle-bloque">
          <h3>Reportado por</h3>
          <p>{reporte.usuario?.nombre || "Ciudadano"}</p>
          <small>
            {formatearFecha(reporte.fecha_registro, true)} ·{" "}
            {formatearFecha(reporte.fecha_cierre, true) !== "—"
              ? `Cerrado ${formatearFecha(reporte.fecha_cierre, true)}`
              : "Sin fecha de cierre"}
          </small>
        </div>

        {reporte.motivo_rechazo && (
          <div className="alert alert-error">
            <span className="alert-icon">!</span>
            <span>{reporte.motivo_rechazo}</span>
          </div>
        )}

        {reporte.fotos?.length > 0 && (
          <div className="detalle-bloque">
            <h3>Evidencias ({reporte.fotos.length})</h3>
            <div className="fotos-grid">
              {reporte.fotos.map((foto) => (
                <a
                  key={foto.id_evidencia}
                  href={foto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="foto-thumb"
                >
                  <img src={foto.url} alt={`Evidencia ${reporte.folio}`} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="detalle-bloque">
          <h3>Seguimiento</h3>
          <ol className="timeline">
            {(historial || []).map((evento) => (
              <li key={evento.id_historial}>
                <span className="timeline-punto" />
                <div>
                  <strong>
                    {ETIQUETAS_ESTADO[evento.estado_nuevo] || evento.estado_nuevo}
                  </strong>
                  <small>
                    {formatearFecha(evento.fecha_cambio, true)} ·{" "}
                    {evento.usuario_nombre}
                  </small>
                  {evento.comentario && <p>{evento.comentario}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {opciones.length > 0 && (
          <form className="cambio-estado" onSubmit={enviar}>
            <h3>Actualizar estado</h3>

            {error && (
              <div className="alert alert-error" role="alert">
                <span className="alert-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <label className="field">
              <span>Nuevo estado</span>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Seleccionar...</option>
                {opciones.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {ETIQUETAS_ESTADO[opcion]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Comentario {estado === "RECHAZADO" && "(obligatorio)"}</span>
              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Describe qué se hizo o el motivo del cambio"
                required={estado === "RECHAZADO"}
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={cargando}
            >
              {cargando ? "Guardando..." : "Guardar cambio"}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
