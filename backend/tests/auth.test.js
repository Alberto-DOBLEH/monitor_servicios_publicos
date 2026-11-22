const {
  hacerRequest,
  assert,
  assertEqual,
  seccion,
  login,
} = require("./helpers");

async function testAuth() {
  const correoPrueba = `prueba.${Date.now()}@servicios.test`;
  const passwordPrueba = "Prueba123!";
  const passwordNueva = "Prueba456!";

  let idPrueba = null;
  let tokenPrueba = null;
  let tokenAdmin = null;
  let tokenCiudadano = null;

  // ──────────────────────────────────────────────────────────────────────────
  seccion("GEO — Alcance Los Mochis");

  {
    const { status, cuerpo } = await hacerRequest("/geo");
    assertEqual(status, 200, "GET /api/geo responde 200");
    assertEqual(cuerpo.ciudad, "Los Mochis", "El alcance es Los Mochis");
    assert(
      cuerpo.limites && cuerpo.limites.latMin === 25.7,
      "El endpoint devuelve los límites de Los Mochis",
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("LOGIN — Administrador y ciudadano");

  {
    const { status, cuerpo } = await login("admin@servicios.test", "Admin123!");
    assertEqual(status, 200, "Login de admin retorna 200");
    assertEqual(cuerpo.success, true, "Login de admin retorna success: true");
    assert(Boolean(cuerpo.token), "Login de admin retorna token");
    assertEqual(cuerpo.usuario?.rol, "ADMIN", "El rol del admin es ADMIN");
    tokenAdmin = cuerpo.token;
  }

  {
    const { status, cuerpo } = await login("ciudadano1@servicios.test", "Ciudadano123!");
    assertEqual(status, 200, "Login de ciudadano retorna 200");
    assertEqual(cuerpo.usuario?.rol, "CIUDADANO", "El rol del ciudadano es CIUDADANO");
    tokenCiudadano = cuerpo.token;
  }

  {
    const { status, cuerpo } = await login("admin@servicios.test", "incorrecta");
    assertEqual(status, 401, "Contraseña incorrecta retorna 401");
    assertEqual(cuerpo.success, false, "Contraseña incorrecta retorna success: false");
  }

  {
    const { status } = await login("noexiste@servicios.test", "Admin123!");
    assertEqual(status, 401, "Correo inexistente retorna 401");
  }

  {
    const { status } = await hacerRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ correo: "admin@servicios.test" }),
    });
    assertEqual(status, 400, "Login sin contraseña retorna 400");
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("ME — Sesión actual");

  {
    const { status, cuerpo } = await hacerRequest("/auth/me", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "GET /auth/me con token admin retorna 200");
    assertEqual(cuerpo.usuario?.correo, "admin@servicios.test", "Devuelve el admin autenticado");
  }

  {
    const { status } = await hacerRequest("/auth/me");
    assertEqual(status, 401, "GET /auth/me sin token retorna 401");
  }

  {
    const { status } = await hacerRequest("/auth/me", {
      headers: { Authorization: "Bearer token_invalido" },
    });
    assertEqual(status, 403, "GET /auth/me con token inválido retorna 403");
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("REGISTRO — Ciudadano");

  {
    const { status, cuerpo } = await hacerRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Usuario de Prueba",
        correo: correoPrueba,
        password: passwordPrueba,
        telefono: "6680000000",
        rol: "ADMIN",
      }),
    });
    assertEqual(status, 201, "Registro de ciudadano retorna 201");
    assertEqual(cuerpo.usuario?.rol, "CIUDADANO", "El registro público siempre crea CIUDADANO");
    assert(Boolean(cuerpo.token), "El registro devuelve token");
    idPrueba = cuerpo.usuario?.id_usuario;
    tokenPrueba = cuerpo.token;
  }

  {
    const { status } = await hacerRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Usuario Duplicado",
        correo: correoPrueba,
        password: passwordPrueba,
      }),
    });
    assertEqual(status, 409, "Correo duplicado retorna 409");
  }

  {
    const { status } = await hacerRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Correo Inválido",
        correo: "correo-invalido",
        password: passwordPrueba,
      }),
    });
    assertEqual(status, 400, "Correo inválido retorna 400");
  }

  {
    const { status } = await hacerRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify({
        nombre: "Contraseña Corta",
        correo: `corta.${Date.now()}@servicios.test`,
        password: "123",
      }),
    });
    assertEqual(status, 400, "Contraseña corta retorna 400");
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("ROLES — Rutas de administrador");

  {
    const { status, cuerpo } = await hacerRequest("/admin/ping", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "Admin accede a /admin/ping");
    assertEqual(cuerpo.usuario?.rol, "ADMIN", "La ruta confirma el rol ADMIN");
  }

  {
    const { status } = await hacerRequest("/admin/ping", {
      headers: { Authorization: `Bearer ${tokenCiudadano}` },
    });
    assertEqual(status, 403, "Ciudadano recibe 403 en /admin/ping");
  }

  {
    const { status } = await hacerRequest("/admin/ping");
    assertEqual(status, 401, "Sin token, /admin/ping retorna 401");
  }

  {
    const { status, cuerpo } = await hacerRequest("/admin/usuarios", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "Admin puede listar usuarios");
    assert(
      Array.isArray(cuerpo.usuarios) && cuerpo.usuarios.length >= 4,
      "El listado incluye a los usuarios de prueba",
    );
  }

  {
    const { status } = await hacerRequest("/admin/usuarios", {
      headers: { Authorization: `Bearer ${tokenCiudadano}` },
    });
    assertEqual(status, 403, "Ciudadano no puede listar usuarios");
  }

  {
    const { status, cuerpo } = await hacerRequest("/admin/resumen", {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assertEqual(status, 200, "Admin puede consultar el resumen");
    assert(
      cuerpo.usuarios && Number(cuerpo.usuarios.total) >= 3,
      "El resumen incluye el total de usuarios",
    );
    assert(
      Array.isArray(cuerpo.reportes_por_estado),
      "El resumen incluye reportes por estado",
    );
  }

  {
    const { status } = await hacerRequest("/admin/resumen", {
      headers: { Authorization: `Bearer ${tokenCiudadano}` },
    });
    assertEqual(status, 403, "Ciudadano no puede consultar el resumen administrativo");
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("PERFIL Y CONTRASEÑA");

  {
    const { status, cuerpo } = await hacerRequest("/auth/perfil", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenPrueba}` },
      body: JSON.stringify({ nombre: "Usuario Actualizado", telefono: "6681111111" }),
    });
    assertEqual(status, 200, "Actualizar perfil retorna 200");
    assertEqual(cuerpo.usuario?.nombre, "Usuario Actualizado", "El nombre se actualiza");
  }

  {
    const { status, cuerpo } = await hacerRequest("/auth/me", {
      headers: { Authorization: `Bearer ${tokenPrueba}` },
    });
    assertEqual(status, 200, "GET /auth/me después de actualizar retorna 200");
    assertEqual(cuerpo.usuario?.nombre, "Usuario Actualizado", "El cambio de perfil persiste");
  }

  {
    const { status } = await hacerRequest("/auth/password", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenPrueba}` },
      body: JSON.stringify({
        password_actual: "incorrecta",
        password_nueva: passwordNueva,
      }),
    });
    assertEqual(status, 401, "Cambio de contraseña con actual incorrecta retorna 401");
  }

  {
    const { status } = await hacerRequest("/auth/password", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenPrueba}` },
      body: JSON.stringify({
        password_actual: passwordPrueba,
        password_nueva: passwordNueva,
      }),
    });
    assertEqual(status, 200, "Cambio de contraseña correcto retorna 200");
  }

  {
    const { status } = await login(correoPrueba, passwordPrueba);
    assertEqual(status, 401, "La contraseña anterior ya no funciona");
  }

  {
    const { status, cuerpo } = await login(correoPrueba, passwordNueva);
    assertEqual(status, 200, "La contraseña nueva funciona");
    tokenPrueba = cuerpo.token;
  }

  // ──────────────────────────────────────────────────────────────────────────
  seccion("CONTROL DE USUARIOS — Activar y desactivar");

  {
    const { status } = await hacerRequest(`/admin/usuarios/${idPrueba}/activo`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ activo: false }),
    });
    assertEqual(status, 200, "Admin desactiva a un ciudadano");
  }

  {
    const { status } = await login(correoPrueba, passwordNueva);
    assertEqual(status, 403, "Un usuario desactivado no puede iniciar sesión");
  }

  {
    const { status } = await hacerRequest("/auth/me", {
      headers: { Authorization: `Bearer ${tokenPrueba}` },
    });
    assertEqual(status, 401, "Un token de usuario desactivado deja de ser válido");
  }

  {
    const { status } = await hacerRequest(`/admin/usuarios/${idPrueba}/activo`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ activo: true }),
    });
    assertEqual(status, 200, "Admin reactiva al ciudadano");
  }

  {
    const { status } = await login(correoPrueba, passwordNueva);
    assertEqual(status, 200, "El ciudadano reactivado puede iniciar sesión");
  }

  {
    const { status } = await hacerRequest("/admin/usuarios/1/activo", {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ activo: false }),
    });
    assertEqual(status, 400, "El admin no puede desactivar su propia cuenta");
  }
}

module.exports = testAuth;
