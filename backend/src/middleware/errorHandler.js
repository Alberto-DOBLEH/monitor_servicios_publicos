/**
 * Manejo global de errores.
 */
const errorHandler = (err, req, res, next) => {
  console.error("[ERROR GLOBAL]", {
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  });

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON malformado en el cuerpo de la petición" });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "El cuerpo de la petición excede el tamaño máximo permitido" });
  }

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Cada imagen debe pesar menos de 5 MB" });
    }

    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Puedes adjuntar máximo 3 imágenes por reporte" });
    }
  }

  return res.status(err.statusCode || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : err.message || "Error interno del servidor",
  });
};

module.exports = errorHandler;
