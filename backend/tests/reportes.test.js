const {
  hacerRequest,
  hacerFormData,
  assert,
  assertEqual,
  seccion,
  login,
} = require("./helpers");
const { sectorDe } = require("../src/controllers/reportesController");
const { LOS_MOCHIS } = require("../src/constants/geo");

// PNG de 1x1 píxel usado como evidencia falsa en las pruebas.
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

const nuevoFormData = ({
  titulo = "Prueba visual de evidencia",
  categoria = 1,
  latitud = 25.792,
  longitud = -108.988,
  fotos = [],
} = {}) => {
  const formData = new FormData();
  formData.append("titulo", titulo);
  formData.append("descripcion", "Reporte creado durante la suite de pruebas.");
  formData.append("id_categoria", String(categoria));
  formData.append("latitud", String(latitud));
  formData.append("longitud", String(longitud));
  formData.append("direccion_referencia", "Calle de prueba, Col. Centro");
  fotos.forEach((nombre, indice) => {
    formData.append(
      "fotos",
      new Blob([Buffer.from(PNG_BASE64, "base64")], { type: "image/png" }),
      `${nombre}-${indice}.png`,
    );
  });
  return formData;
};

async function testReportes() {
  let tokenAdmin = null;
  let tokenCiudadano1 = null;
  let tokenCiudadano2 = null;
  let idReporteJson = null;
  let idReporteFotos = null;
  let idReporteRechazo = null;
  let urlFoto = null;

  // ──────────────────────────────────────────────────────────────────────────
  seccion("PREPARACIÓN — Sesiones");

  {
    const { status, cuerpo } = await login("admin@servicios.test", "Admin123!");
    assertEqual(status, 200, "Login de admin para pruebas de reportes");
    tokenAdmin = cuerpo.token;
  }

  {
    const { status, cuerpo } = await login(
      "ciudadano1@servicios.test",
      "Ciudadano123!",
    );
    assertEqual(status, 200, "Login de ciudadano 1");
    tokenCiudadano1 = cuerpo.token;
  }

  {
    const { status, cuerpo } = await login(
      "ciudadano2@servicios.test",
      "Ciudadano123!",
    );
    assertEqual(status, 200, "Login de ciudadano 2");
    tokenCiudadano2 = cuerpo.token;
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("CATEGORÍAS DE SERVICIOS PÚBLICOS");

  {
    const { status, cuerpo } = await hacerRequest("/categorias");
    assertEqual(status, 200, "GET /api/categorias responde 200");
    assertEqual(cuerpo.total, 9, "Hay 9 categorías activas");
    assert(
      cuerpo.categorias.some(
        (c) => c.nombre === "Alumbrado público" && c.color,
      ),
      "El catálogo incluye nombre y color de cada servicio",
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("ALTA DE REPORTES — Validación y GPS");

  {
    const { status } = await hacerRequest("/reportes", {
      method: "POST",
      body: JSON.stringify({
        titulo: "Reporte sin sesión",
        id_categoria: 1,
        latitud: 25.79,
        longitud: -108.98,
      }),
    });
    assertEqual(status, 401, "Crear reporte sin token retorna 401");
  }

  {
    const { status, cuerpo } = await hacerRequest("/reportes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      body: JSON.stringify({
        titulo: "Reporte fuera de Los Mochis",
        id_categoria: 1,
        latitud: 19.4326,
        longitud: -99.1332,
      }),
    });
    assertEqual(status, 400, "Coordenadas fuera de Los Mochis retornan 400");
    assert(
      String(cuerpo.error).includes("Los Mochis"),
      "El error indica que está fuera del área de cobertura",
    );
  }

  {
    const { status } = await hacerRequest("/reportes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      body: JSON.stringify({
        titulo: "Categoría inexistente",
        id_categoria: 999,
        latitud: 25.79,
        longitud: -108.98,
      }),
    });
    assertEqual(status, 400, "Categoría inexistente retorna 400");
  }

  {
    const { status } = await hacerRequest("/reportes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      body: JSON.stringify({
        titulo: "abc",
        id_categoria: 1,
        latitud: 25.79,
        longitud: -108.98,
      }),
    });
    assertEqual(status, 400, "Título demasiado corto retorna 400");
  }

  {
    const { status, cuerpo } = await hacerRequest("/reportes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      body: JSON.stringify({
        titulo: "Fuga de agua en la esquina",
        descripcion: "Sale agua de la tubería desde esta mañana.",
        id_categoria: 4,
        latitud: 25.7915,
        longitud: -108.9875,
        direccion_referencia: "Calle Prueba 12",
        id_usuario: 1,
        rol: "ADMIN",
      }),
    });
    assertEqual(status, 201, "Reporte válido sin fotos retorna 201");
    assertEqual(cuerpo.reporte?.estado, "PENDIENTE", "Nace en estado PENDIENTE");
    assert(
      /^SP-\d{4}-\d{4}$/.test(cuerpo.reporte?.folio || ""),
      "El folio tiene formato SP-AAAA-NNNN",
    );
    idReporteJson = cuerpo.reporte?.id_reporte;
  }

  {
    const { status, cuerpo } = await hacerFormData(
      "/reportes",
      nuevoFormData({ titulo: "Reporte con tres evidencias", fotos: ["a", "b", "c"] }),
      { headers: { Authorization: `Bearer ${tokenCiudadano1}` } },
    );
    assertEqual(status, 201, "Reporte multipart con 3 fotos retorna 201");
    idReporteFotos = cuerpo.reporte?.id_reporte;
  }

  {
    const { status } = await hacerFormData(
      "/reportes",
      nuevoFormData({ titulo: "Demasiadas evidencias", fotos: ["a", "b", "c", "d"] }),
      { headers: { Authorization: `Bearer ${tokenCiudadano1}` } },
    );
    assertEqual(status, 400, "Más de 3 imágenes retorna 400");
  }

  {
    const formData = nuevoFormData({ titulo: "Formato inválido" });
    formData.append(
      "fotos",
      new Blob([" texto "], { type: "text/plain" }),
      "no-imagen.txt",
    );
    const { status } = await hacerFormData("/reportes", formData, {
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
    });
    assertEqual(status, 400, "Archivo que no es imagen retorna 400");
  }

  {
    const { status, cuerpo } = await hacerRequest("/reportes", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      body: JSON.stringify({
        titulo: "Reporte que será rechazado",
        id_categoria: 9,
        latitud: 25.7935,
        longitud: -108.9865,
      }),
    });
    assertEqual(status, 201, "Tercer reporte de prueba creado");
    idReporteRechazo = cuerpo.reporte?.id_reporte;
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("DETALLE Y EVIDENCIAS FOTOGRÁFICAS");

  {
    const { status, cuerpo } = await hacerRequest(`/reportes/${idReporteFotos}`, {
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
    });
    assertEqual(status, 200, "Detalle del reporte con fotos responde 200");
    assertEqual(cuerpo.reporte?.fotos?.length, 3, "Se guardaron 3 evidencias");
    assert(
      cuerpo.reporte.fotos.every((f) =>
        f.url.startsWith("http://localhost:3100/uploads/reportes/"),
      ),
      "Las URLs de fotos son absolutas y accesibles",
    );
    assert(
      cuerpo.historial?.length === 1 &&
        cuerpo.historial[0].estado_nuevo === "PENDIENTE",
      "El alta registra el estado inicial en el historial",
    );
    urlFoto = cuerpo.reporte.fotos[0].url;
  }

  if (urlFoto) {
    const respuesta = await fetch(urlFoto);
    assertEqual(respuesta.status, 200, "La evidencia se descarga por HTTP");
    assert(
      (respuesta.headers.get("content-type") || "").includes("image/png"),
      "La evidencia se sirve con MIME de imagen",
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("MAPA PÚBLICO — Puntos exactos");

  {
    const { status, cuerpo } = await hacerRequest("/reportes");
    assertEqual(status, 200, "GET /api/reportes responde 200 sin token");
    assert(
      cuerpo.total >= 17,
      "El mapa incluye los reportes activos semilla y los nuevos",
    );
    assert(
      cuerpo.reportes.every(
        (r) =>
          !("usuario" in r) &&
          r.latitud >= LOS_MOCHIS.bounds.latMin &&
          r.latitud <= LOS_MOCHIS.bounds.latMax &&
          r.longitud >= LOS_MOCHIS.bounds.lngMin &&
          r.longitud <= LOS_MOCHIS.bounds.lngMax,
      ),
      "Los puntos son exactos, están en Los Mochis y no exponen usuario",
    );
    assert(
      cuerpo.reportes.every((r) => r.categoria?.nombre && r.estado),
      "Cada punto incluye categoría y estado",
    );
  }

  {
    const { status, cuerpo } = await hacerRequest(
      "/reportes?categoria_id=1&estado=PENDIENTE",
    );
    assertEqual(status, 200, "Filtros combinados del mapa responden 200");
    assert(
      cuerpo.reportes.every(
        (r) => r.id_categoria === 1 && r.estado === "PENDIENTE",
      ),
      "Los filtros por categoría y estado se aplican",
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("MIS REPORTES — Aislamiento por usuario");

  {
    const { status, cuerpo } = await hacerRequest("/reportes/mis-reportes", {
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
    });
    assertEqual(status, 200, "Ciudadano 1 consulta mis-reportes");
    assertEqual(cuerpo.total, 11, "Ciudadano 1 ve sus 11 reportes");
    assert(
      [idReporteJson, idReporteFotos, idReporteRechazo].every((id) =>
        cuerpo.reportes.some((r) => r.id_reporte === id),
      ),
      "Los reportes creados quedaron asociados al token, no al body",
    );
  }

  {
    const { status, cuerpo } = await hacerRequest("/reportes/mis-reportes", {
      headers: { Authorization: `Bearer ${tokenCiudadano2}` },
    });
    assertEqual(status, 200, "Ciudadano 2 consulta mis-reportes");
    assertEqual(cuerpo.total, 8, "Ciudadano 2 ve únicamente sus 8 reportes");
    assert(
      !cuerpo.reportes.some((r) => r.id_reporte === idReporteJson),
      "Ciudadano 2 no ve el reporte de ciudadano 1",
    );
  }

  {
    const { status } = await hacerRequest(`/reportes/${idReporteJson}`, {
      headers: { Authorization: `Bearer ${tokenCiudadano2}` },
    });
    assertEqual(status, 403, "Otro ciudadano no puede ver el detalle");
  }

  {
    const { status, cuerpo } = await hacerRequest(`/reportes/${idReporteJson}`, {
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
    });
    assertEqual(status, 200, "El dueño sí puede ver el detalle");
    assert(
      !("usuario" in (cuerpo.reporte || {})),
      "El detalle de ciudadano no expone datos del usuario",
    );
  }

  {
    const { status, cuerpo } = await hacerRequest(`/reportes/${idReporteJson}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "El admin puede ver cualquier reporte");
    assertEqual(
      cuerpo.reporte?.usuario?.id_usuario,
      2,
      "El detalle de admin incluye el ciudadano correcto",
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("CICLO DE VIDA — Transiciones e historial");

  {
    const { status } = await hacerRequest(`/reportes/${idReporteJson}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      body: JSON.stringify({ estado: "EN_PROCESO" }),
    });
    assertEqual(status, 403, "Ciudadano no puede cambiar estados");
  }

  {
    const { status } = await hacerRequest(`/reportes/${idReporteJson}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ estado: "COMPLETADO" }),
    });
    assertEqual(status, 400, "PENDIENTE → COMPLETADO no es permitido");
  }

  {
    const { status, cuerpo } = await hacerRequest(
      `/reportes/${idReporteJson}/estado`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({
          estado: "EN_PROCESO",
          comentario: "Validado y asignado al equipo de agua potable.",
        }),
      },
    );
    assertEqual(status, 200, "PENDIENTE → EN_PROCESO retorna 200");
    assertEqual(cuerpo.reporte?.estado, "EN_PROCESO", "El reporte cambia de estado");
    assertEqual(cuerpo.historial?.length, 2, "El historial crece a 2 eventos");
  }

  {
    const { status } = await hacerRequest(`/reportes/${idReporteJson}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ estado: "EN_PROCESO" }),
    });
    assertEqual(status, 400, "Repetir el mismo estado retorna 400");
  }

  {
    const { status, cuerpo } = await hacerRequest(
      `/reportes/${idReporteJson}/estado`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({
          estado: "COMPLETADO",
          comentario: "Fuga reparada y verificada.",
        }),
      },
    );
    assertEqual(status, 200, "EN_PROCESO → COMPLETADO retorna 200");
    assert(cuerpo.reporte?.fecha_cierre, "COMPLETADO registra fecha de cierre");
    assertEqual(cuerpo.historial?.length, 3, "El historial crece a 3 eventos");
  }

  {
    const { status } = await hacerRequest(`/reportes/${idReporteJson}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ estado: "PENDIENTE" }),
    });
    assertEqual(status, 400, "COMPLETADO → PENDIENTE no es permitido");
  }

  {
    const { status, cuerpo } = await hacerRequest(
      `/reportes/${idReporteJson}/historial`,
      {
        headers: { Authorization: `Bearer ${tokenCiudadano1}` },
      },
    );
    assertEqual(status, 200, "Dueño consulta el historial");
    assertEqual(cuerpo.total, 3, "El historial tiene 3 eventos");
    assert(
      cuerpo.historial.some((h) => h.estado_nuevo === "COMPLETADO"),
      "El timeline incluye la completación",
    );
  }

  {
    const { status } = await hacerRequest(`/reportes/${idReporteRechazo}/estado`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ estado: "RECHAZADO" }),
    });
    assertEqual(status, 400, "Rechazar sin motivo retorna 400");
  }

  {
    const motivo = "Reporte duplicado del folio SP-2026-0001.";
    const { status, cuerpo } = await hacerRequest(
      `/reportes/${idReporteRechazo}/estado`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ estado: "RECHAZADO", comentario: motivo }),
      },
    );
    assertEqual(status, 200, "Rechazar con motivo retorna 200");
    assertEqual(cuerpo.reporte?.motivo_rechazo, motivo, "Se guarda el motivo");
    assert(cuerpo.reporte?.fecha_cierre, "RECHAZADO registra fecha de cierre");
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("PANEL ADMINISTRATIVO — Listado y métricas");

  {
    const { status } = await hacerRequest("/reportes/admin/todos", {
      headers: { Authorization: `Bearer ${tokenCiudadano1}` },
    });
    assertEqual(status, 403, "Ciudadano no accede al listado administrativo");
  }

  {
    const { status, cuerpo } = await hacerRequest("/reportes/admin/todos", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "Admin consulta el listado completo");
    assertEqual(cuerpo.total, 19, "El listado incluye los 19 reportes");
    assert(
      cuerpo.reportes.some((r) => r.usuario?.id_usuario === 2),
      "El listado admin incluye el ciudadano de cada reporte",
    );
    assert(
      cuerpo.reportes.some((r) => r.fotos?.length === 3),
      "El listado admin incluye las evidencias",
    );
  }

  {
    const { status, cuerpo } = await hacerRequest(
      "/reportes/admin/todos?estado=PENDIENTE&categoria_id=1",
      { headers: { Authorization: `Bearer ${tokenAdmin}` } },
    );
    assertEqual(status, 200, "Filtros administrativos responden 200");
    assert(
      cuerpo.reportes.every(
        (r) => r.estado === "PENDIENTE" && r.id_categoria === 1,
      ),
      "Los filtros administrativos se aplican",
    );
  }

  {
    const { status, cuerpo } = await hacerRequest("/reportes/estadisticas", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "Admin consulta estadísticas");
    assertEqual(cuerpo.total, 19, "El total de estadísticas coincide");
    assert(
      Array.isArray(cuerpo.por_estado) && Array.isArray(cuerpo.por_categoria),
      "Se devuelven métricas por estado y categoría",
    );
    assert(
      Array.isArray(cuerpo.por_sector) && cuerpo.por_sector.length > 0,
      "Se calculan sectores de Los Mochis",
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("SECTORES DE LOS MOCHIS");

  {
    const { center } = LOS_MOCHIS;
    assertEqual(sectorDe(center.lat, center.lng), "Centro", "El centro es Centro");
    assertEqual(sectorDe(center.lat + 0.05, center.lng), "Norte", "Norte");
    assertEqual(sectorDe(center.lat - 0.05, center.lng), "Sur", "Sur");
    assertEqual(sectorDe(center.lat, center.lng + 0.05), "Oriente", "Oriente");
    assertEqual(sectorDe(center.lat, center.lng - 0.05), "Poniente", "Poniente");
  }
}

module.exports = testReportes;
