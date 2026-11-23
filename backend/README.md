# Backend — API de Monitoreo de Servicios Públicos

API REST que gestiona autenticación, roles, reportes ciudadanos, evidencias, historial de
estados, estadísticas y exportación CSV. Es el único componente que habla con MariaDB.

Volver al [README raíz](../README.md).

## Índice

| Sección | Contenido |
|---|---|
| [Propósito](#propósito) | Qué hace y qué no hace este módulo |
| [Stack](#stack) | Dependencias principales |
| [Prerrequisitos](#prerrequisitos) | Herramientas y servicios previos |
| [Instalación](#instalación) | Pasos para replicar el entorno |
| [Variables de entorno](#variables-de-entorno) | `.env` y significado de cada variable |
| [Comandos](#comandos) | Desarrollo, base de datos y pruebas |
| [API](#api) | Grupos de rutas y permisos |
| [Almacenamiento](#almacenamiento) | Evidencias y APK |
| [Estructura](#estructura) | Mapa de carpetas |
| [Pruebas](#pruebas) | Runner y resultado esperado |
| [Solución de problemas](#solución-de-problemas) | Errores frecuentes |

## Propósito

- Expone `/api/auth`, `/api/admin`, `/api/categorias`, `/api/reportes` y `/api/geo`.
- Valida JWT, roles (`ADMIN` / `CIUDADANO`) y propiedad de los reportes.
- Aplica el límite geográfico de Los Mochis a nuevas evidencias y coordenadas.
- Persiste evidencias en disco y sirve el APK de la app ciudadana.
- Genera el CSV de reportes con los filtros activos (solo `ADMIN`).

No sirve la web ni la app: esos clientes están en [`frontend/`](../frontend/README.md) y
[`mobile/`](../mobile/README.md).

## Stack

| Dependencia | Uso |
|---|---|
| Node.js 20+ / npm | Entorno de ejecución |
| Express 5 | Servidor HTTP y enrutamiento |
| mysql2 | Conexión a MariaDB |
| bcrypt | Hash de contraseñas |
| jsonwebtoken | Tokens JWT de sesión |
| express-validator | Validación de entradas |
| express-rate-limit | Límite de intentos de login y global |
| helmet / cors / compression | Cabeceras de seguridad, CORS y gzip |
| multer | Recepción de fotos (multipart) |
| dotenv | Carga de `.env` |
| nodemon | Recarga en desarrollo |

## Prerrequisitos

1. Node.js 20+.
2. MariaDB local expuesto en `127.0.0.1:3307`. Desde la raíz:

   ```bash
   podman compose up -d     # o: docker compose up -d
   ```

3. `.env` creado a partir de `.env.example` (ver siguiente sección).

## Instalación

```bash
cd backend
cp .env.example .env       # solo la primera vez
npm install
npm run db:setup           # ejecuta BD.sql: crea esquema y datos de prueba
npm run dev                # http://localhost:3000
```

Comprobación rápida:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/categorias
```

## Variables de entorno

Copia `backend/.env.example` a `backend/.env`. Valores por defecto para desarrollo local:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto HTTP de la API |
| `NODE_ENV` | `development` | `test` se usa en la suite automatizada |
| `DB_HOST` | `127.0.0.1` | Host de MariaDB |
| `DB_PORT` | `3307` | Puerto mapeado por `docker-compose.yml` |
| `DB_USER` | `root` | Usuario de la base |
| `DB_PASSWORD` | `root` | Contraseña de la base |
| `DB_NAME` | `monitor_servicios_publicos` | Nombre de la base |
| `DB_SSL` | `false` | Habilita SSL en la conexión MySQL |
| `JWT_SECRET` | `cambia_este_secreto_en_produccion` | Secreto de firma; **cambiar en producción** |
| `JWT_EXPIRATION` | `8h` | Vigencia del token |
| `FRONTEND_URL` | `http://localhost:5173` | Origen permitido por CORS |
| `BACKEND_URL` | `http://localhost:3000` | Base para URLs absolutas de evidencias |

El frontend desarrollado en Vite usa `http://localhost:5173`. El backend rechaza orígenes
distintos (por ejemplo `http://127.0.0.1:5173`) con `Bloqueado por CORS`.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con nodemon (recarga al guardar) |
| `npm start` | Servidor sin recarga |
| `npm run db:setup` | Reinicia el esquema y carga `BD.sql` (borra datos de prueba previos) |
| `npm test` | Suite completa: reinicia la BD, levanta la API en `:3100` y ejecuta 133 pruebas |

## API

### Pública

`GET /health`, `GET /api/geo`, `GET /api/categorias`, `GET /api/reportes`,
`GET /downloads/monitoreo-servicios.apk`.

### Autenticada (token JWT)

`POST /api/auth/registro` y `POST /api/auth/login` son públicos; el resto exige
`Authorization: Bearer <token>`:

- `/api/auth/me`, `PUT /api/auth/perfil`, `PUT /api/auth/password`.
- `POST /api/reportes`, `GET /api/reportes/mis-reportes`,
  `GET /api/reportes/:id`, `GET /api/reportes/:id/historial`.

### Solo `ADMIN`

- `/api/admin/ping`, `/api/admin/usuarios`, `PUT /api/admin/usuarios/:id/activo`,
  `/api/admin/resumen`.
- `GET /api/reportes/admin/todos`, `GET /api/reportes/admin/exportar`,
  `GET /api/reportes/estadisticas`, `PATCH /api/reportes/:id/estado`.

La lista completa está en el [README raíz](../README.md#endpoints).

## Almacenamiento

| Ruta | Contenido | Versionado |
|---|---|---|
| `backend/uploads/reportes/` | Evidencias fotográficas generadas en local | No (`.gitignore`) |
| `backend/downloads/monitoreo-servicios.apk` | APK servido desde el mapa público | No |

`URL_PUBLICA` es `/uploads/reportes` y los archivos se sirven con `express.static`.
Las evidencias usan nombres UUID y se devuelven como URLs absolutas con `BACKEND_URL`.
La función `guardarEvidencias` está aislada para migrar a Cloudinary en producción.

## Estructura

```text
backend/
├── index.js               # Arranque, CORS, Helmet, rutas, archivos estáticos
├── setup_db.js            # Carga de BD.sql
├── .env.example           # Plantilla de variables
├── src/
│   ├── config/            # db, validateEnv, uploads
│   ├── constants/         # geo (Los Mochis), estados y transiciones
│   ├── controllers/       # auth, admin, categorías, reportes
│   ├── middleware/        # JWT, roles, rate limit, errores
│   └── routes/            # authRoutes, adminRoutes, publicRoutes, ...
├── tests/                 # 133 pruebas + runner autocontenido
└── downloads/             # APK local (ignorado)
```

## Pruebas

```bash
cd backend
npm test
```

El runner:

1. Ejecuta `setup_db.js` y reinicia `monitor_servicios_publicos`.
2. Levanta un backend aislado en `http://localhost:3100` con `NODE_ENV=test`.
3. Ejecuta las suites de autenticación y reportes.
4. Detiene el servidor al terminar.

Resultado esperado: **133 pruebas, 0 fallos**.

> `npm test` **destruye los datos actuales** de la base de prueba. No lo ejecutes contra
> información que quieras conservar.

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3307` | Contenedor de MariaDB detenido | `podman compose up -d` o `podman start monitor_servicios_db` |
| `Cannot find module 'mysql2/promise'` | Dependencias no instaladas | `npm install` |
| `Error al configurar la base de datos` al probar | Falta `.env` | `cp .env.example .env` |
| `Bloqueado por CORS: http://127.0.0.1:5173` | Origen no permitido | Abre la web en `http://localhost:5173` |
| `429 Too Many Requests` en login | Rate limit de 10 intentos / 15 min | Espera o reinicia nodemon (`touch index.js`) |
| Fotos no cargan | Faltan archivos en `uploads/` o `BACKEND_URL` incorrecto | Revisa `BACKEND_URL` y vuelve a subir evidencias |
