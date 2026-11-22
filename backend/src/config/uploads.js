const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

/**
 * Almacenamiento local de evidencias para desarrollo.
 *
 * En producción se puede sustituir `guardarEvidencias` por una subida a
 * Cloudinary sin cambiar los controladores: la API siempre devuelve
 * `{ url, public_id }` por cada archivo.
 */
const MAX_IMAGENES = 3;
const MAX_TAMANO_IMAGEN = 5 * 1024 * 1024; // 5 MB

const DIRECTORIO_UPLOADS = path.join(__dirname, "..", "..", "uploads", "reportes");
const URL_PUBLICA = "/uploads/reportes";

const MIME_A_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!MIME_A_EXT[file.mimetype]) {
    const error = new Error(
      "Formato de imagen no permitido. Usa JPEG, PNG o WebP.",
    );
    error.statusCode = 400;
    return cb(error);
  }

  return cb(null, true);
};

const subirImagenes = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_TAMANO_IMAGEN,
    files: MAX_IMAGENES,
  },
}).array("fotos", MAX_IMAGENES);

const guardarEvidencias = async (archivos = []) => {
  if (archivos.length === 0) return [];

  await fs.mkdir(DIRECTORIO_UPLOADS, { recursive: true });

  const evidencias = [];

  for (const archivo of archivos) {
    const extension = MIME_A_EXT[archivo.mimetype] || ".jpg";
    const nombre = `${crypto.randomUUID()}${extension}`;
    const rutaCompleta = path.join(DIRECTORIO_UPLOADS, nombre);

    await fs.writeFile(rutaCompleta, archivo.buffer);

    evidencias.push({
      url: `${URL_PUBLICA}/${nombre}`,
      public_id: null,
    });
  }

  return evidencias;
};

const eliminarEvidencias = async (evidencias = []) => {
  await Promise.all(
    evidencias.map(async (evidencia) => {
      if (!evidencia?.url?.startsWith(URL_PUBLICA)) return;

      const nombre = path.basename(evidencia.url);
      const ruta = path.join(DIRECTORIO_UPLOADS, nombre);

      try {
        await fs.unlink(ruta);
      } catch {
        // Si el archivo no existe, no hay nada que limpiar.
      }
    }),
  );
};

/** Devuelve una URL absoluta para que Flutter y el admin puedan mostrarla. */
const urlAbsoluta = (req, url) => {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) return url;

  const base = (process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`)
    .trim()
    .replace(/\/$/, "");

  return `${base}${url}`;
};

module.exports = {
  MAX_IMAGENES,
  MAX_TAMANO_IMAGEN,
  DIRECTORIO_UPLOADS,
  URL_PUBLICA,
  subirImagenes,
  guardarEvidencias,
  eliminarEvidencias,
  urlAbsoluta,
};
