const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * Verifica el JWT y vuelve a consultar al usuario en la base de datos.
 *
 * Esto es intencionalmente estricto: si un usuario es desactivado o cambia
 * de rol, el token anterior deja de tener el rol viejo en la siguiente
 * petición.
 */
const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_cambiar_en_produccion",
    );

    const [filas] = await pool.query(
      `SELECT id_usuario, nombre, correo, telefono, rol, activo, fecha_registro
       FROM Usuario
       WHERE id_usuario = ?`,
      [decoded.id_usuario],
    );

    if (filas.length === 0 || !filas[0].activo) {
      return res.status(401).json({ error: "Usuario no válido o desactivado" });
    }

    req.usuario = filas[0];
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expirado, inicia sesión nuevamente" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Token inválido" });
    }

    console.error("[AUTH] Error verificando token:", error);
    return res.status(500).json({ error: "Error al verificar la sesión" });
  }
};

/**
 * Restringe una ruta a uno o varios roles.
 * Uso: requiereRol("ADMIN")
 */
const requiereRol = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: "Autenticación requerida" });
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({
      error: "No tienes permisos para realizar esta acción",
    });
  }

  return next();
};

module.exports = {
  verificarToken,
  requiereRol,
};
