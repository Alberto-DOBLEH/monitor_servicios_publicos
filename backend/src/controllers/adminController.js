const pool = require("../config/db");

const listarUsuarios = async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT id_usuario, nombre, correo, telefono, rol, activo, fecha_registro, ultimo_acceso
       FROM Usuario
       ORDER BY fecha_registro DESC`,
    );

    return res.json({ total: filas.length, usuarios: filas });
  } catch (error) {
    console.error("[ADMIN] Error listando usuarios:", error);
    return res.status(500).json({ error: "No se pudieron obtener los usuarios" });
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  if (typeof activo !== "boolean") {
    return res.status(400).json({ error: "El campo activo debe ser booleano" });
  }

  if (id === req.usuario.id_usuario && activo === false) {
    return res.status(400).json({ error: "No puedes desactivar tu propia cuenta" });
  }

  try {
    const [resultado] = await pool.query(
      "UPDATE Usuario SET activo = ? WHERE id_usuario = ?",
      [activo, id],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({
      success: true,
      mensaje: activo ? "Usuario activado" : "Usuario desactivado",
    });
  } catch (error) {
    console.error("[ADMIN] Error cambiando estado de usuario:", error);
    return res.status(500).json({ error: "No se pudo actualizar el usuario" });
  }
};

const resumen = async (req, res) => {
  try {
    const [[usuarios], [porEstado], [categorias]] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(rol = 'ADMIN') AS administradores,
          SUM(rol = 'CIUDADANO') AS ciudadanos,
          SUM(activo = TRUE) AS activos
        FROM Usuario
      `),
      pool.query(`
        SELECT estado, COUNT(*) AS total
        FROM Reporte
        GROUP BY estado
      `),
      pool.query("SELECT COUNT(*) AS total FROM Categoria_Servicio WHERE activo = TRUE"),
    ]);

    return res.json({
      usuarios: usuarios[0],
      reportes_por_estado: porEstado,
      categorias_activas: categorias[0].total,
    });
  } catch (error) {
    console.error("[ADMIN] Error generando resumen:", error);
    return res.status(500).json({ error: "No se pudo generar el resumen" });
  }
};

module.exports = {
  listarUsuarios,
  cambiarEstadoUsuario,
  resumen,
};
