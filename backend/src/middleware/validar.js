const { validationResult } = require("express-validator");

const validarCampos = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    const lista = errores.array();
    return res.status(400).json({
      error: lista[0].msg,
      errores: lista.map((e) => ({ campo: e.path, mensaje: e.msg })),
    });
  }

  return next();
};

module.exports = { validarCampos };
