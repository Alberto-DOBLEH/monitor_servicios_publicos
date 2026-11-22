const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const SALT_ROUNDS = 12;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "8h";

const normalizarCorreo = (correo) => String(correo || "").trim().toLowerCase();

const usuarioPublico = (usuario) => ({
  id_usuario: usuario.id_usuario,
  nombre: usuario.nombre,
  correo: usuario.correo,
  telefono: usuario.telefono || null,
  rol: usuario.rol,
  activo: Boolean(usuario.activo),
  fecha_registro: usuario.fecha_registro,
});

const generarToken = (usuario) =>
  jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    },
    process.env.JWT_SECRET || "dev_secret_cambiar_en_produccion",
    { expiresIn: JWT_EXPIRATION },
  );

/**
 * POST /api/auth/registro
 * Registro público. Siempre crea un usuario CIUDADANO.
 */
const registro = async (req, res) => {
  const { nombre, correo, password, telefono } = req.body;

  try {
    const correoLimpio = normalizarCorreo(correo);

    const [existentes] = await pool.query(
      "SELECT id_usuario FROM Usuario WHERE correo = ? LIMIT 1",
      [correoLimpio],
    );

    if (existentes.length > 0) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [resultado] = await pool.query(
      `INSERT INTO Usuario (nombre, correo, contrasena, telefono, rol, activo)
       VALUES (?, ?, ?, ?, 'CIUDADANO', TRUE)`,
      [String(nombre).trim(), correoLimpio, hash, telefono ? String(telefono).trim() : null],
    );

    const [filas] = await pool.query(
      `SELECT id_usuario, nombre, correo, telefono, rol, activo, fecha_registro
       FROM Usuario WHERE id_usuario = ?`,
      [resultado.insertId],
    );

    const usuario = filas[0];

    return res.status(201).json({
      success: true,
      mensaje: "Cuenta de ciudadano creada correctamente",
      token: generarToken(usuario),
      usuario: usuarioPublico(usuario),
    });
  } catch (error) {
    console.error("[AUTH] Error en registro:", error);
    return res.status(500).json({ error: "No se pudo crear la cuenta" });
  }
};

/**
 * POST /api/auth/login
 * Login para ciudadanos y administradores.
 */
const login = async (req, res) => {
  const correoRecibido = req.body.correo || req.body.usuario;
  const { password } = req.body;

  try {
    const correoLimpio = normalizarCorreo(correoRecibido);

    const [filas] = await pool.query(
      `SELECT id_usuario, nombre, correo, telefono, contrasena, rol, activo, fecha_registro
       FROM Usuario
       WHERE correo = ?
       LIMIT 1`,
      [correoLimpio],
    );

    if (filas.length === 0) {
      return res.status(401).json({ success: false, error: "Correo o contraseña incorrectos" });
    }

    const usuario = filas[0];

    if (!usuario.activo) {
      return res.status(403).json({ success: false, error: "La cuenta está desactivada" });
    }

    const contrasenaValida = await bcrypt.compare(password, usuario.contrasena);

    if (!contrasenaValida) {
      return res.status(401).json({ success: false, error: "Correo o contraseña incorrectos" });
    }

    await pool.query("UPDATE Usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?", [
      usuario.id_usuario,
    ]);

    return res.json({
      success: true,
      mensaje: `Bienvenido ${usuario.nombre}`,
      token: generarToken(usuario),
      usuario: usuarioPublico(usuario),
    });
  } catch (error) {
    console.error("[AUTH] Error en login:", error);
    return res.status(500).json({ success: false, error: "Error al iniciar sesión" });
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res) => {
  return res.json({
    success: true,
    usuario: usuarioPublico(req.usuario),
  });
};

/**
 * PUT /api/auth/perfil
 */
const actualizarPerfil = async (req, res) => {
  const { nombre, telefono } = req.body;

  if (!nombre || String(nombre).trim().length < 2) {
    return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
  }

  try {
    await pool.query("UPDATE Usuario SET nombre = ?, telefono = ? WHERE id_usuario = ?", [
      String(nombre).trim(),
      telefono ? String(telefono).trim() : null,
      req.usuario.id_usuario,
    ]);

    const [filas] = await pool.query(
      `SELECT id_usuario, nombre, correo, telefono, rol, activo, fecha_registro
       FROM Usuario WHERE id_usuario = ?`,
      [req.usuario.id_usuario],
    );

    return res.json({
      success: true,
      mensaje: "Perfil actualizado",
      usuario: usuarioPublico(filas[0]),
    });
  } catch (error) {
    console.error("[AUTH] Error actualizando perfil:", error);
    return res.status(500).json({ error: "No se pudo actualizar el perfil" });
  }
};

/**
 * PUT /api/auth/password
 */
const cambiarPassword = async (req, res) => {
  const { password_actual, password_nueva } = req.body;

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: "Debes indicar la contraseña actual y la nueva" });
  }

  if (String(password_nueva).length < 8) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
  }

  try {
    const [filas] = await pool.query(
      "SELECT contrasena FROM Usuario WHERE id_usuario = ?",
      [req.usuario.id_usuario],
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const valida = await bcrypt.compare(password_actual, filas[0].contrasena);

    if (!valida) {
      return res.status(401).json({ error: "La contraseña actual no es correcta" });
    }

    const nuevoHash = await bcrypt.hash(password_nueva, SALT_ROUNDS);

    await pool.query("UPDATE Usuario SET contrasena = ? WHERE id_usuario = ?", [
      nuevoHash,
      req.usuario.id_usuario,
    ]);

    return res.json({ success: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("[AUTH] Error cambiando contraseña:", error);
    return res.status(500).json({ error: "No se pudo cambiar la contraseña" });
  }
};

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

module.exports = {
  registro,
  login,
  me,
  actualizarPerfil,
  cambiarPassword,
  hashPassword,
};
