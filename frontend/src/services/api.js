import { API_BASE_URL } from "../config";

/**
 * Cliente HTTP mínimo para el panel administrativo.
 * Adjunta el JWT y normaliza los errores de la API.
 */
export async function apiFetch(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const respuesta = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let datos = null;

  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const error = new Error(datos?.error || "No se pudo completar la solicitud");
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}
