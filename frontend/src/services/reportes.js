import { API_BASE_URL } from "../config";
import { apiFetch } from "./api";

const construirQuery = (filtros = {}) => {
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      params.set(clave, String(valor));
    }
  });

  const cadena = params.toString();
  return cadena ? `?${cadena}` : "";
};

/** Configuración geográfica centralizada (centro, zoom y límites). */
export const obtenerGeo = () => apiFetch("/api/geo");

/** Catálogo de categorías de servicios públicos. */
export const obtenerCategorias = () => apiFetch("/api/categorias");

/** Reportes activos para el mapa público. */
export const obtenerReportes = (filtros) =>
  apiFetch(`/api/reportes${construirQuery(filtros)}`);

/** Listado completo con filtros, solo administradores. */
export const obtenerReportesAdmin = (token, filtros) =>
  apiFetch(`/api/reportes/admin/todos${construirQuery(filtros)}`, { token });

/** Detalle con fotos e historial. */
export const obtenerReporte = (id, token) =>
  apiFetch(`/api/reportes/${id}`, { token });

/** Cambio de estado controlado por el administrador. */
export const cambiarEstadoReporte = (id, datos, token) =>
  apiFetch(`/api/reportes/${id}/estado`, {
    method: "PATCH",
    token,
    body: JSON.stringify(datos),
  });

/** Métricas del panel. */
export const obtenerEstadisticas = (token) =>
  apiFetch("/api/reportes/estadisticas", { token });

/** Descarga el CSV filtrado (solo ADMIN). */
export async function exportarCSV(token, filtros = {}) {
  const respuesta = await fetch(
    `${API_BASE_URL}/api/reportes/admin/exportar${construirQuery(filtros)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!respuesta.ok) {
    let mensaje = "No se pudo exportar el CSV";
    try {
      const datos = await respuesta.json();
      mensaje = datos.error || mensaje;
    } catch {
      // Cuerpo no JSON.
    }
    const error = new Error(mensaje);
    error.status = respuesta.status;
    throw error;
  }

  const blob = await respuesta.blob();
  const disposition = respuesta.headers.get("Content-Disposition") || "";
  const coincidencia = disposition.match(/filename="?([^";]+)"?/i);
  const nombre = coincidencia
    ? coincidencia[1]
    : `reportes-servicios-${new Date().toISOString().slice(0, 10)}.csv`;

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
