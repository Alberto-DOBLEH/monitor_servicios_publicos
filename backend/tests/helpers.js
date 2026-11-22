const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000/api";

const VERDE = "\x1b[32m";
const ROJO = "\x1b[31m";
const AMARILLO = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let totalTests = 0;
let pasados = 0;
let fallidos = 0;
const errores = [];

async function responder(respuesta) {
  let cuerpo;

  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = await respuesta.text();
  }

  return { status: respuesta.status, cuerpo, headers: respuesta.headers };
}

async function hacerRequest(ruta, opciones = {}) {
  const url = ruta.startsWith("http") ? ruta : `${BASE_URL}${ruta}`;
  const respuesta = await fetch(url, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...opciones.headers },
  });

  return responder(respuesta);
}

/** Petición multipart para probar la subida de evidencias fotográficas. */
async function hacerFormData(ruta, formData, opciones = {}) {
  const url = ruta.startsWith("http") ? ruta : `${BASE_URL}${ruta}`;
  const respuesta = await fetch(url, {
    ...opciones,
    method: opciones.method || "POST",
    body: formData,
    headers: { ...opciones.headers },
  });

  return responder(respuesta);
}

function assert(condicion, mensaje) {
  totalTests++;
  if (condicion) {
    pasados++;
    console.log(`  ${VERDE}[OK]${RESET} ${mensaje}`);
  } else {
    fallidos++;
    errores.push(mensaje);
    console.log(`  ${ROJO}[FALLO]${RESET} ${mensaje}`);
  }
}

function assertEqual(actual, esperado, mensaje) {
  totalTests++;
  if (actual === esperado) {
    pasados++;
    console.log(`  ${VERDE}[OK]${RESET} ${mensaje}`);
  } else {
    fallidos++;
    const detalle = `${mensaje} (esperado: ${esperado}, obtenido: ${actual})`;
    errores.push(detalle);
    console.log(`  ${ROJO}[FALLO]${RESET} ${detalle}`);
  }
}

function seccion(nombre) {
  console.log(`\n${CYAN}${BOLD}=== ${nombre} ===${RESET}`);
}

function resumen() {
  console.log(`\n${BOLD}=======================================${RESET}`);
  console.log(`${BOLD}  RESUMEN DE TESTS${RESET}`);
  console.log(`${BOLD}=======================================${RESET}`);
  console.log(`  Total:   ${totalTests}`);
  console.log(`  ${VERDE}Pasados: ${pasados}${RESET}`);
  console.log(`  ${ROJO}Fallidos: ${fallidos}${RESET}`);

  if (errores.length > 0) {
    console.log(`\n${ROJO}${BOLD}  Tests fallidos:${RESET}`);
    errores.forEach((e) => console.log(`    ${ROJO}* ${e}${RESET}`));
  }

  console.log(`${BOLD}=======================================${RESET}\n`);
  return { totalTests, pasados, fallidos };
}

async function login(correo, password) {
  return hacerRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo, password }),
  });
}

module.exports = {
  BASE_URL,
  hacerRequest,
  hacerFormData,
  assert,
  assertEqual,
  seccion,
  resumen,
  login,
  VERDE,
  ROJO,
  AMARILLO,
  CYAN,
  RESET,
  BOLD,
};
