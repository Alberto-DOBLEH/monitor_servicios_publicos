const rateLimit = require("express-rate-limit");

const omitirEnTests = () => process.env.NODE_ENV === "test";

const limiteGlobal = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: omitirEnTests,
  message: { error: "Demasiadas peticiones, intenta de nuevo en un minuto" },
});

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: omitirEnTests,
  message: { error: "Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos" },
});

const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: omitirEnTests,
  message: { error: "Demasiados registros desde esta IP, intenta más tarde" },
});

/** Evita spam de reportes: 5 por minuto por IP. */
const limiteReportes = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: omitirEnTests,
  message: {
    error: "Demasiados reportes enviados. Espera un momento antes de intentar de nuevo.",
  },
});

module.exports = {
  limiteGlobal,
  limiteLogin,
  limiteRegistro,
  limiteReportes,
};
