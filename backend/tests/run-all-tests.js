// ─────────────────────────────────────────────────────────────────────────────
// Runner principal — Monitoreo de Servicios Públicos (Fases 1 y 2)
//
// Prepara un entorno aislado:
//   1. Reinicia la base de datos de prueba.
//   2. Levanta un backend en el puerto 3100 con NODE_ENV=test.
//   3. Ejecuta todas las suites contra ese backend.
//   4. Detiene el backend al terminar.
//
// Uso: npm test
// ─────────────────────────────────────────────────────────────────────────────

const { spawn, spawnSync } = require("child_process");
const path = require("path");

const PUERTO_TEST = Number(process.env.TEST_PORT || 3100);
const RAIZ_BACKEND = path.join(__dirname, "..");

process.env.NODE_ENV = "test";
process.env.TEST_BASE_URL = `http://localhost:${PUERTO_TEST}/api`;
process.env.BACKEND_URL = `http://localhost:${PUERTO_TEST}`;

const {
  BASE_URL,
  seccion,
  resumen,
  VERDE,
  ROJO,
  CYAN,
  BOLD,
  RESET,
  AMARILLO,
} = require("./helpers");
const testAuth = require("./auth.test");
const testReportes = require("./reportes.test");

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function verificarConexion() {
  for (let intento = 0; intento < 40; intento += 1) {
    try {
      const respuesta = await fetch(`${BASE_URL}/geo`);
      if (respuesta.ok) return true;
    } catch {
      // El servidor aún está arrancando.
    }

    await esperar(250);
  }

  return false;
}

function reiniciarBaseDeDatos() {
  console.log(`\n${AMARILLO}[i] Reiniciando base de datos de prueba...${RESET}`);

  const resultado = spawnSync(
    process.execPath,
    [path.join(RAIZ_BACKEND, "setup_db.js")],
    {
      cwd: RAIZ_BACKEND,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    },
  );

  if (resultado.status !== 0) {
    console.log(`${ROJO}[ERR] No se pudo reiniciar la base de datos:${RESET}`);
    console.log(resultado.stderr?.toString() || resultado.stdout?.toString());
    process.exit(1);
  }

  console.log(`${VERDE}[OK] Base de datos de prueba lista${RESET}`);
}

async function ejecutarTodos() {
  console.log(`\n${BOLD}+-----------------------------------------------------------+${RESET}`);
  console.log(`${BOLD}|   TESTS — MONITOREO DE SERVICIOS PÚBLICOS (FASES 1 Y 2)   |${RESET}`);
  console.log(`${BOLD}|   Autenticación, roles, reportes, fotos e historial        |${RESET}`);
  console.log(`${BOLD}+-----------------------------------------------------------+${RESET}`);

  reiniciarBaseDeDatos();

  const servidor = spawn(
    process.execPath,
    [path.join(RAIZ_BACKEND, "index.js")],
    {
      cwd: RAIZ_BACKEND,
      env: { ...process.env, NODE_ENV: "test", PORT: String(PUERTO_TEST) },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let logsServidor = "";
  servidor.stdout.on("data", (dato) => {
    logsServidor += dato.toString();
  });
  servidor.stderr.on("data", (dato) => {
    logsServidor += dato.toString();
  });

  const detenerServidor = () => {
    if (!servidor.killed) servidor.kill("SIGTERM");
  };

  process.on("exit", detenerServidor);

  console.log(`\n${AMARILLO}[i] Levantando backend de pruebas en ${PUERTO_TEST}...${RESET}`);
  const conectado = await verificarConexion();

  if (!conectado) {
    console.log(`${ROJO}${BOLD}[ERR] El backend de pruebas no respondió${RESET}`);
    console.log(logsServidor);
    detenerServidor();
    process.exit(1);
  }

  console.log(`${VERDE}[OK] Backend de pruebas conectado${RESET}`);

  const inicio = Date.now();

  try {
    await testAuth();
    await testReportes();
  } catch (error) {
    console.log(`\n${ROJO}${BOLD}[ERR] Error fatal durante los tests:${RESET}`);
    console.log(`${ROJO}   ${error.message}${RESET}`);
    console.log(`${ROJO}   ${error.stack}${RESET}\n`);
  } finally {
    detenerServidor();
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
  const resultado = resumen();

  console.log(`  ${CYAN}Tiempo total: ${duracion}s${RESET}\n`);

  process.exit(resultado.fallidos > 0 ? 1 : 0);
}

ejecutarTodos();
