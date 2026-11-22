const pool = require("../config/db");
const {
  LOS_MOCHIS,
  dentroDeLosMochis,
} = require("../constants/geo");
const {
  ESTADOS,
  ESTADOS_ACTIVOS,
  TRANSICIONES_PERMITIDAS,
  esTransicionValida,
  requiereFechaCierre,
} = require("../constants/estados");
const {
  guardarEvidencias,
  eliminarEvidencias,
  urlAbsoluta,
} = require("../config/uploads");

const COLUMNAS_REPORTE = `
  r.id_reporte, r.folio, r.id_usuario, r.id_categoria,
  r.titulo, r.descripcion, r.latitud, r.longitud, r.direccion_referencia,
  r.estado, r.prioridad, r.id_admin_asignado,
  r.fecha_registro, r.fecha_actualizacion, r.fecha_cierre, r.motivo_rechazo,
  c.nombre AS categoria_nombre, c.icono AS categoria_icono, c.color AS categoria_color,
  u.nombre AS usuario_nombre
`;

const JOINES_REPORTE = `
  FROM Reporte r
  INNER JOIN Categoria_Servicio c ON c.id_categoria = r.id_categoria
  INNER JOIN Usuario u ON u.id_usuario = r.id_usuario
`;

const serializarReporte = (fila, req, { incluirUsuario = false } = {}) => {
  const reporte = {
    id_reporte: fila.id_reporte,
    folio: fila.folio,
    id_categoria: fila.id_categoria,
    categoria: {
      nombre: fila.categoria_nombre,
      icono: fila.categoria_icono,
      color: fila.categoria_color,
    },
    titulo: fila.titulo,
    descripcion: fila.descripcion || null,
    latitud: Number(fila.latitud),
    longitud: Number(fila.longitud),
    direccion_referencia: fila.direccion_referencia || null,
    estado: fila.estado,
    prioridad: fila.prioridad,
    fecha_registro: fila.fecha_registro,
    fecha_actualizacion: fila.fecha_actualizacion,
    fecha_cierre: fila.fecha_cierre || null,
    motivo_rechazo: fila.motivo_rechazo || null,
    fotos: [],
  };

  if (incluirUsuario) {
    reporte.usuario = {
      id_usuario: fila.id_usuario,
      nombre: fila.usuario_nombre,
    };
    reporte.id_admin_asignado = fila.id_admin_asignado || null;
  }

  return reporte;
};

/** Carga las evidencias de varios reportes en una sola consulta. */
const adjuntarEvidencias = async (req, reportes) => {
  if (reportes.length === 0) return reportes;

  const ids = reportes.map((r) => r.id_reporte);
  const placeholders = ids.map(() => "?").join(", ");

  const [filas] = await pool.query(
    `SELECT id_evidencia, id_reporte, url, public_id, fecha_subida
     FROM Reporte_Evidencia
     WHERE id_reporte IN (${placeholders})
     ORDER BY id_evidencia ASC`,
    ids,
  );

  const porReporte = new Map(ids.map((id) => [id, []]));

  filas.forEach((fila) => {
    porReporte.get(fila.id_reporte)?.push({
      id_evidencia: fila.id_evidencia,
      url: urlAbsoluta(req, fila.url),
      public_id: fila.public_id || null,
      fecha_subida: fila.fecha_subida,
    });
  });

  reportes.forEach((reporte) => {
    reporte.fotos = porReporte.get(reporte.id_reporte) || [];
  });

  return reportes;
};

const obtenerHistorial = async (idReporte) => {
  const [filas] = await pool.query(
    `SELECT h.id_historial, h.estado_anterior, h.estado_nuevo, h.comentario,
            h.fecha_cambio, h.id_usuario, u.nombre AS usuario_nombre
     FROM Reporte_Historial h
     INNER JOIN Usuario u ON u.id_usuario = h.id_usuario
     WHERE h.id_reporte = ?
     ORDER BY h.fecha_cambio ASC, h.id_historial ASC`,
    [idReporte],
  );

  return filas;
};

const sectorDe = (latitud, longitud) => {
  const lat = Number(latitud);
  const lng = Number(longitud);
  const dLat = lat - LOS_MOCHIS.center.lat;
  const dLng = lng - LOS_MOCHIS.center.lng;
  const umbral = 0.02;

  if (Math.abs(dLat) <= umbral && Math.abs(dLng) <= umbral) return "Centro";
  if (dLat > umbral) return "Norte";
  if (dLat < -umbral) return "Sur";
  if (dLng > umbral) return "Oriente";
  return "Poniente";
};

const esAdmin = (usuario) => usuario?.rol === "ADMIN";
const puedeVer = (usuario, idUsuarioReporte) =>
  esAdmin(usuario) || usuario?.id_usuario === idUsuarioReporte;

/**
 * POST /api/reportes
 *
 * Acepta JSON (sin fotos) o multipart/form-data con hasta 3 imágenes
 * en el campo `fotos`. El id_usuario siempre sale del JWT.
 */
const crearReporte = async (req, res) => {
  const { id_categoria, titulo, descripcion, latitud, longitud, direccion_referencia } =
    req.body;
  const archivos = req.files || [];

  const lat = Number(latitud);
  const lng = Number(longitud);

  if (!dentroDeLosMochis(lat, lng)) {
    return res.status(400).json({
      error:
        "Tu ubicación está fuera del área de cobertura de Los Mochis, Sinaloa.",
    });
  }

  let evidenciasGuardadas = [];
  let conexion;

  try {
    const [categorias] = await pool.query(
      "SELECT id_categoria FROM Categoria_Servicio WHERE id_categoria = ? AND activo = TRUE",
      [id_categoria],
    );

    if (categorias.length === 0) {
      return res.status(400).json({ error: "La categoría seleccionada no existe o está inactiva" });
    }

    evidenciasGuardadas = await guardarEvidencias(archivos);

    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    const anio = new Date().getFullYear();
    let idReporte = null;
    let folio = null;

    for (let intento = 0; intento < 4 && !idReporte; intento += 1) {
      const [conteo] = await conexion.query(
        "SELECT COUNT(*) AS total FROM Reporte WHERE YEAR(fecha_registro) = YEAR(NOW())",
      );
      const consecutivo = Number(conteo[0].total) + 1 + intento;
      const folioCandidato = `SP-${anio}-${String(consecutivo).padStart(4, "0")}`;

      try {
        const [resultado] = await conexion.query(
          `INSERT INTO Reporte
            (folio, id_usuario, id_categoria, titulo, descripcion, latitud, longitud,
             direccion_referencia, estado, prioridad)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', 'MEDIA')`,
          [
            folioCandidato,
            req.usuario.id_usuario,
            id_categoria,
            String(titulo).trim(),
            descripcion ? String(descripcion).trim() : null,
            lat,
            lng,
            direccion_referencia ? String(direccion_referencia).trim() : null,
          ],
        );

        idReporte = resultado.insertId;
        folio = folioCandidato;
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY" && intento < 3) continue;
        throw error;
      }
    }

    if (evidenciasGuardadas.length > 0) {
      const valores = evidenciasGuardadas.map((e) => [
        idReporte,
        e.url,
        e.public_id,
      ]);
      await conexion.query(
        "INSERT INTO Reporte_Evidencia (id_reporte, url, public_id) VALUES ?",
        [valores],
      );
    }

    await conexion.query(
      `INSERT INTO Reporte_Historial
        (id_reporte, estado_anterior, estado_nuevo, comentario, id_usuario)
       VALUES (?, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', ?)`,
      [idReporte, req.usuario.id_usuario],
    );

    await conexion.commit();

    return res.status(201).json({
      success: true,
      mensaje:
        "Reporte registrado correctamente. Tu folio es " + folio,
      reporte: {
        id_reporte: idReporte,
        folio,
        estado: ESTADOS.PENDIENTE,
        latitud: lat,
        longitud: lng,
      },
    });
  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch {
        // No hay transacción activa.
      }
    }

    await eliminarEvidencias(evidenciasGuardadas);

    console.error("[REPORTES] Error creando reporte:", error);
    return res.status(500).json({ error: "No se pudo registrar el reporte" });
  } finally {
    if (conexion) conexion.release();
  }
};

/**
 * GET /api/reportes
 * Mapa público: puntos exactos de reportes activos dentro de Los Mochis.
 * No expone datos personales del ciudadano.
 */
const listarReportes = async (req, res) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 100, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const { latMin, latMax, lngMin, lngMax } = LOS_MOCHIS.bounds;

    const condiciones = [
      `r.estado IN (${ESTADOS_ACTIVOS.map(() => "?").join(", ")})`,
      "r.latitud BETWEEN ? AND ?",
      "r.longitud BETWEEN ? AND ?",
    ];
    const parametros = [
      ...ESTADOS_ACTIVOS,
      latMin,
      latMax,
      lngMin,
      lngMax,
    ];

    if (req.query.categoria_id) {
      condiciones.push("r.id_categoria = ?");
      parametros.push(req.query.categoria_id);
    }

    if (req.query.estado) {
      condiciones.push("r.estado = ?");
      parametros.push(req.query.estado);
    }

    const where = `WHERE ${condiciones.join(" AND ")}`;

    const [[conteo], [filas]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total ${JOINES_REPORTE} ${where}`, parametros),
      pool.query(
        `SELECT ${COLUMNAS_REPORTE} ${JOINES_REPORTE} ${where}
         ORDER BY r.fecha_registro DESC
         LIMIT ? OFFSET ?`,
        [...parametros, limite, offset],
      ),
    ]);

    const reportes = await adjuntarEvidencias(
      req,
      filas.map((fila) => serializarReporte(fila, req)),
    );

    return res.json({
      total: conteo[0].total,
      limite,
      offset,
      reportes,
    });
  } catch (error) {
    console.error("[REPORTES] Error listando reportes:", error);
    return res.status(500).json({ error: "No se pudieron obtener los reportes" });
  }
};

/** GET /api/reportes/mis-reportes — solo los reportes del usuario autenticado. */
const misReportes = async (req, res) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 100, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const condiciones = ["r.id_usuario = ?"];
    const parametros = [req.usuario.id_usuario];

    if (req.query.estado) {
      condiciones.push("r.estado = ?");
      parametros.push(req.query.estado);
    }

    if (req.query.categoria_id) {
      condiciones.push("r.id_categoria = ?");
      parametros.push(req.query.categoria_id);
    }

    const where = `WHERE ${condiciones.join(" AND ")}`;

    const [[conteo], [filas]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total ${JOINES_REPORTE} ${where}`, parametros),
      pool.query(
        `SELECT ${COLUMNAS_REPORTE} ${JOINES_REPORTE} ${where}
         ORDER BY r.fecha_registro DESC
         LIMIT ? OFFSET ?`,
        [...parametros, limite, offset],
      ),
    ]);

    const reportes = await adjuntarEvidencias(
      req,
      filas.map((fila) => serializarReporte(fila, req)),
    );

    return res.json({
      total: conteo[0].total,
      limite,
      offset,
      reportes,
    });
  } catch (error) {
    console.error("[REPORTES] Error en mis-reportes:", error);
    return res.status(500).json({ error: "No se pudieron obtener tus reportes" });
  }
};

/** GET /api/reportes/admin/todos — listado completo con filtros, solo ADMIN. */
const listarTodosAdmin = async (req, res) => {
  try {
    const limite = Math.min(Number(req.query.limite) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const condiciones = ["1 = 1"];
    const parametros = [];

    if (req.query.estado) {
      condiciones.push("r.estado = ?");
      parametros.push(req.query.estado);
    }

    if (req.query.categoria_id) {
      condiciones.push("r.id_categoria = ?");
      parametros.push(req.query.categoria_id);
    }

    if (req.query.id_usuario) {
      condiciones.push("r.id_usuario = ?");
      parametros.push(req.query.id_usuario);
    }

    if (req.query.prioridad) {
      condiciones.push("r.prioridad = ?");
      parametros.push(req.query.prioridad);
    }

    if (req.query.buscar) {
      const termino = `%${String(req.query.buscar).trim()}%`;
      condiciones.push("(r.folio LIKE ? OR r.titulo LIKE ?)");
      parametros.push(termino, termino);
    }

    const where = `WHERE ${condiciones.join(" AND ")}`;

    const [[conteo], [filas]] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total ${JOINES_REPORTE} ${where}`, parametros),
      pool.query(
        `SELECT ${COLUMNAS_REPORTE} ${JOINES_REPORTE} ${where}
         ORDER BY
           FIELD(r.estado, 'PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ARCHIVADO'),
           r.fecha_registro DESC
         LIMIT ? OFFSET ?`,
        [...parametros, limite, offset],
      ),
    ]);

    const reportes = await adjuntarEvidencias(
      req,
      filas.map((fila) => serializarReporte(fila, req, { incluirUsuario: true })),
    );

    return res.json({
      total: conteo[0].total,
      limite,
      offset,
      reportes,
    });
  } catch (error) {
    console.error("[REPORTES] Error en listado admin:", error);
    return res.status(500).json({ error: "No se pudieron obtener los reportes" });
  }
};

/** GET /api/reportes/:id — detalle con fotos e historial. */
const obtenerReporte = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID de reporte inválido" });
  }

  try {
    const [filas] = await pool.query(
      `SELECT ${COLUMNAS_REPORTE} ${JOINES_REPORTE} WHERE r.id_reporte = ?`,
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    if (!puedeVer(req.usuario, filas[0].id_usuario)) {
      return res.status(403).json({
        error: "Solo puedes consultar tus propios reportes",
      });
    }

    const [reporte] = await adjuntarEvidencias(req, [
      serializarReporte(filas[0], req, { incluirUsuario: esAdmin(req.usuario) }),
    ]);

    const historial = await obtenerHistorial(id);

    return res.json({ reporte, historial });
  } catch (error) {
    console.error("[REPORTES] Error obteniendo reporte:", error);
    return res.status(500).json({ error: "No se pudo obtener el reporte" });
  }
};

/** GET /api/reportes/:id/historial — timeline de cambios de estado. */
const historialReporte = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID de reporte inválido" });
  }

  try {
    const [filas] = await pool.query(
      "SELECT id_usuario FROM Reporte WHERE id_reporte = ?",
      [id],
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    if (!puedeVer(req.usuario, filas[0].id_usuario)) {
      return res.status(403).json({
        error: "Solo puedes consultar tus propios reportes",
      });
    }

    const historial = await obtenerHistorial(id);
    return res.json({ total: historial.length, historial });
  } catch (error) {
    console.error("[REPORTES] Error obteniendo historial:", error);
    return res.status(500).json({ error: "No se pudo obtener el historial" });
  }
};

/**
 * PATCH /api/reportes/:id/estado — cambio de estado controlado por ADMIN.
 * Registra cada transición en Reporte_Historial.
 */
const cambiarEstado = async (req, res) => {
  const id = Number(req.params.id);
  const { estado, comentario } = req.body;
  const idAdminAsignado = req.body.id_admin_asignado
    ? Number(req.body.id_admin_asignado)
    : null;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID de reporte inválido" });
  }

  if (!Object.values(ESTADOS).includes(estado)) {
    return res.status(400).json({ error: "Estado no válido" });
  }

  if (estado === ESTADOS.RECHAZADO && !comentario?.trim()) {
    return res
      .status(400)
      .json({ error: "Debes indicar el motivo del rechazo" });
  }

  let conexion;

  try {
    conexion = await pool.getConnection();
    await conexion.beginTransaction();

    const [filas] = await conexion.query(
      `SELECT r.id_reporte, r.id_usuario, r.estado
       FROM Reporte r WHERE r.id_reporte = ? FOR UPDATE`,
      [id],
    );

    if (filas.length === 0) {
      await conexion.rollback();
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    const reporte = filas[0];

    if (reporte.estado === estado) {
      await conexion.rollback();
      return res.status(400).json({
        error: `El reporte ya se encuentra en estado ${estado}`,
      });
    }

    if (!esTransicionValida(reporte.estado, estado)) {
      await conexion.rollback();
      return res.status(400).json({
        error: `Transición no permitida: ${reporte.estado} → ${estado}`,
        estado_actual: reporte.estado,
        transiciones_permitidas: TRANSICIONES_PERMITIDAS[reporte.estado],
      });
    }

    const fechaCierre = requiereFechaCierre(estado) ? new Date() : null;

    await conexion.query(
      `UPDATE Reporte
       SET estado = ?,
           id_admin_asignado = COALESCE(?, id_admin_asignado, ?),
           fecha_cierre = ?,
           motivo_rechazo = ?
       WHERE id_reporte = ?`,
      [
        estado,
        idAdminAsignado,
        idAdminAsignado || req.usuario.id_usuario,
        fechaCierre,
        estado === ESTADOS.RECHAZADO ? String(comentario).trim() : null,
        id,
      ],
    );

    await conexion.query(
      `INSERT INTO Reporte_Historial
        (id_reporte, estado_anterior, estado_nuevo, comentario, id_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        reporte.estado,
        estado,
        comentario ? String(comentario).trim() : null,
        req.usuario.id_usuario,
      ],
    );

    await conexion.commit();

    const [actualizado] = await pool.query(
      `SELECT ${COLUMNAS_REPORTE} ${JOINES_REPORTE} WHERE r.id_reporte = ?`,
      [id],
    );

    const [reporteSerializado] = await adjuntarEvidencias(req, [
      serializarReporte(actualizado[0], req, { incluirUsuario: true }),
    ]);

    return res.json({
      success: true,
      mensaje: `Estado actualizado a ${estado}`,
      reporte: reporteSerializado,
      historial: await obtenerHistorial(id),
    });
  } catch (error) {
    if (conexion) {
      try {
        await conexion.rollback();
      } catch {
        // No hay transacción activa.
      }
    }

    console.error("[REPORTES] Error cambiando estado:", error);
    return res.status(500).json({ error: "No se pudo actualizar el estado" });
  } finally {
    if (conexion) conexion.release();
  }
};

/** GET /api/reportes/estadisticas — métricas para el panel administrativo. */
const estadisticas = async (req, res) => {
  try {
    const [porEstado, porCategoria, porPrioridad, porSector, filas] =
      await Promise.all([
        pool.query(
          "SELECT estado, COUNT(*) AS total FROM Reporte GROUP BY estado",
        ),
        pool.query(
          `SELECT c.id_categoria, c.nombre, c.color, COUNT(r.id_reporte) AS total
           FROM Categoria_Servicio c
           LEFT JOIN Reporte r ON r.id_categoria = c.id_categoria
           GROUP BY c.id_categoria, c.nombre, c.color
           ORDER BY total DESC, c.id_categoria`,
        ),
        pool.query(
          "SELECT prioridad, COUNT(*) AS total FROM Reporte GROUP BY prioridad",
        ),
        pool.query(
          `SELECT latitud, longitud FROM Reporte
           WHERE estado IN (${ESTADOS_ACTIVOS.map(() => "?").join(", ")})`,
          ESTADOS_ACTIVOS,
        ),
        pool.query("SELECT COUNT(*) AS total FROM Reporte"),
      ]);

    const sectores = {};
    porSector[0].forEach((fila) => {
      const sector = sectorDe(fila.latitud, fila.longitud);
      sectores[sector] = (sectores[sector] || 0) + 1;
    });

    return res.json({
      total: filas[0][0].total,
      por_estado: porEstado[0],
      por_categoria: porCategoria[0],
      por_prioridad: porPrioridad[0],
      por_sector: Object.entries(sectores)
        .map(([sector, total]) => ({ sector, total }))
        .sort((a, b) => b.total - a.total),
      centros: LOS_MOCHIS,
    });
  } catch (error) {
    console.error("[REPORTES] Error generando estadísticas:", error);
    return res.status(500).json({ error: "No se pudieron generar las estadísticas" });
  }
};

module.exports = {
  crearReporte,
  listarReportes,
  misReportes,
  listarTodosAdmin,
  obtenerReporte,
  historialReporte,
  cambiarEstado,
  estadisticas,
  sectorDe,
};
