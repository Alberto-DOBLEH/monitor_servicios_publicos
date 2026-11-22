const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function runSetup() {
  const dbConfig = {
    host: (process.env.DB_HOST || "127.0.0.1").trim(),
    port: Number(process.env.DB_PORT || 3306),
    user: (process.env.DB_USER || "root").trim(),
    password: (process.env.DB_PASSWORD || "root").trim(),
    multipleStatements: true,
  };

  console.log(`Conectando a MySQL/MariaDB en ${dbConfig.host}:${dbConfig.port}...`);

  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("Conexión establecida.");

    const sqlPath = path.join(__dirname, "..", "BD.sql");

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró BD.sql en ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("Ejecutando BD.sql...");
    await connection.query(sql);
    console.log("\nBase de datos 'monitor_servicios_publicos' creada con datos de prueba.");
    console.log("Credenciales de prueba:");
    console.log("  Admin:     admin@servicios.test / Admin123!");
    console.log("  Ciudadano: ciudadano1@servicios.test / Ciudadano123!");
    console.log("  Ciudadano: ciudadano2@servicios.test / Ciudadano123!");
  } catch (error) {
    console.error("\nError al configurar la base de datos:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSetup();
