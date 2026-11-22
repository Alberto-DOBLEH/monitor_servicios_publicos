const express = require("express");
const { body } = require("express-validator");
const {
  registro,
  login,
  me,
  actualizarPerfil,
  cambiarPassword,
} = require("../controllers/authController");
const { verificarToken } = require("../middleware/auth");
const { limiteLogin, limiteRegistro } = require("../middleware/rateLimiter");
const { validarCampos } = require("../middleware/validar");

const router = express.Router();

router.post(
  "/registro",
  limiteRegistro,
  [
    body("nombre")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("El nombre debe tener entre 2 y 120 caracteres"),
    body("correo")
      .trim()
      .isEmail()
      .withMessage("El correo no es válido")
      .isLength({ max: 150 })
      .withMessage("El correo es demasiado largo"),
    body("password")
      .isLength({ min: 8, max: 72 })
      .withMessage("La contraseña debe tener entre 8 y 72 caracteres"),
    body("telefono")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 20 })
      .withMessage("El teléfono es demasiado largo"),
  ],
  validarCampos,
  registro,
);

router.post(
  "/login",
  limiteLogin,
  [
    body("password").isString().notEmpty().withMessage("La contraseña es obligatoria"),
    body().custom((value) => {
      if (!value.correo && !value.usuario) {
        throw new Error("El correo es obligatorio");
      }
      return true;
    }),
  ],
  validarCampos,
  login,
);

router.get("/me", verificarToken, me);

router.put(
  "/perfil",
  verificarToken,
  [
    body("nombre")
      .trim()
      .isLength({ min: 2, max: 120 })
      .withMessage("El nombre debe tener entre 2 y 120 caracteres"),
    body("telefono")
      .optional({ values: "falsy" })
      .trim()
      .isLength({ max: 20 })
      .withMessage("El teléfono es demasiado largo"),
  ],
  validarCampos,
  actualizarPerfil,
);

router.put(
  "/password",
  verificarToken,
  [
    body("password_actual").isString().notEmpty().withMessage("La contraseña actual es obligatoria"),
    body("password_nueva")
      .isLength({ min: 8, max: 72 })
      .withMessage("La nueva contraseña debe tener entre 8 y 72 caracteres"),
  ],
  validarCampos,
  cambiarPassword,
);

module.exports = router;
