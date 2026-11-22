const express = require("express");
const { body } = require("express-validator");
const {
  crearReporte,
  listarReportes,
  misReportes,
  listarTodosAdmin,
  exportarCSV,
  obtenerReporte,
  historialReporte,
  cambiarEstado,
  estadisticas,
} = require("../controllers/reportesController");
const {
  verificarToken,
  requiereRol,
} = require("../middleware/auth");
const { subirImagenes } = require("../config/uploads");
const { limiteReportes } = require("../middleware/rateLimiter");
const { validarCampos } = require("../middleware/validar");
const { ESTADOS } = require("../constants/estados");

const router = express.Router();

const validarReporte = [
  body("id_categoria")
    .isInt({ min: 1 })
    .withMessage("Selecciona una categoría válida")
    .toInt(),
  body("titulo")
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage("El título debe tener entre 5 y 120 caracteres"),
  body("descripcion")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La descripción no puede exceder 2000 caracteres"),
  body("latitud")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitud no válida")
    .toFloat(),
  body("longitud")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitud no válida")
    .toFloat(),
  body("direccion_referencia")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 255 })
    .withMessage("La referencia no puede exceder 255 caracteres"),
];

// Mapa público. No requiere sesión.
router.get("/", listarReportes);

// Rutas específicas antes que /:id para evitar capturas ambiguas.
router.get("/mis-reportes", verificarToken, misReportes);

router.get(
  "/admin/todos",
  verificarToken,
  requiereRol("ADMIN"),
  listarTodosAdmin,
);

router.get(
  "/estadisticas",
  verificarToken,
  requiereRol("ADMIN"),
  estadisticas,
);

router.get(
  "/admin/exportar",
  verificarToken,
  requiereRol("ADMIN"),
  exportarCSV,
);

router.post(
  "/",
  verificarToken,
  limiteReportes,
  subirImagenes,
  validarReporte,
  validarCampos,
  crearReporte,
);

router.get("/:id", verificarToken, obtenerReporte);
router.get("/:id/historial", verificarToken, historialReporte);

router.patch(
  "/:id/estado",
  verificarToken,
  requiereRol("ADMIN"),
  [
    body("estado")
      .isIn(Object.values(ESTADOS))
      .withMessage("Estado no válido"),
    body("comentario")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 500 })
      .withMessage("El comentario no puede exceder 500 caracteres"),
    body("id_admin_asignado")
      .optional({ values: "falsy" })
      .isInt({ min: 1 })
      .withMessage("ID de administrador no válido")
      .toInt(),
  ],
  validarCampos,
  cambiarEstado,
);

module.exports = router;
