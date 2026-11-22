/**
 * Valida las variables de entorno obligatorias al arrancar la API.
 * Si falta alguna, detiene el proceso con un mensaje claro.
 */
const validateEnv = () => {
  const required = [
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "JWT_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n❌ Variables de entorno faltantes: ${missing.join(", ")}`);
    console.error("   Copia backend/.env.example a backend/.env y completa los valores.\n");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    const recommended = ["FRONTEND_URL", "BACKEND_URL"];
    const missingRecommended = recommended.filter((key) => !process.env[key]);

    if (missingRecommended.length > 0) {
      console.warn(
        `⚠️  Variables recomendadas en producción no configuradas: ${missingRecommended.join(", ")}`,
      );
    }
  }
};

module.exports = validateEnv;
