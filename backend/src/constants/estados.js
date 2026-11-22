/**
 * Ciclo de vida de un reporte de servicio público.
 *
 * PENDIENTE  → el ciudadano lo envió, el admin aún no lo revisa.
 * EN_PROCESO → hay un equipo trabajando en la falla.
 * COMPLETADO → la falla fue resuelta y verificada.
 * RECHAZADO  → duplicado, fuera de alcance o sin verificable.
 * ARCHIVADO  → cierre administrativo; estado terminal.
 */
const ESTADOS = {
  PENDIENTE: "PENDIENTE",
  EN_PROCESO: "EN_PROCESO",
  COMPLETADO: "COMPLETADO",
  RECHAZADO: "RECHAZADO",
  ARCHIVADO: "ARCHIVADO",
};

const TRANSICIONES_PERMITIDAS = {
  PENDIENTE: ["EN_PROCESO", "RECHAZADO", "ARCHIVADO"],
  EN_PROCESO: ["COMPLETADO", "RECHAZADO", "ARCHIVADO"],
  COMPLETADO: ["ARCHIVADO"],
  RECHAZADO: ["ARCHIVADO"],
  ARCHIVADO: [],
};

const ESTADOS_ACTIVOS = ["PENDIENTE", "EN_PROCESO", "COMPLETADO"];
const ESTADOS_CERRADOS = ["COMPLETADO", "RECHAZADO", "ARCHIVADO"];

const esTransicionValida = (actual, nuevo) =>
  Boolean(TRANSICIONES_PERMITIDAS[actual]?.includes(nuevo));

const requiereFechaCierre = (estado) => ESTADOS_CERRADOS.includes(estado);

module.exports = {
  ESTADOS,
  TRANSICIONES_PERMITIDAS,
  ESTADOS_ACTIVOS,
  esTransicionValida,
  requiereFechaCierre,
};
