const express = require("express");
const {
  listarUsuarios,
  cambiarEstadoUsuario,
  resumen,
} = require("../controllers/adminController");
const { verificarToken, requiereRol } = require("../middleware/auth");

const router = express.Router();

// Todas las rutas de este router requieren sesión de administrador.
router.use(verificarToken, requiereRol("ADMIN"));

router.get("/ping", (req, res) => {
  res.json({
    success: true,
    mensaje: "Acceso de administrador verificado",
    usuario: {
      id_usuario: req.usuario.id_usuario,
      nombre: req.usuario.nombre,
      rol: req.usuario.rol,
    },
  });
});

router.get("/usuarios", listarUsuarios);
router.put("/usuarios/:id/activo", cambiarEstadoUsuario);
router.get("/resumen", resumen);

module.exports = router;
