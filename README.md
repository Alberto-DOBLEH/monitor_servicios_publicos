# Monitoreo de Servicios Públicos — Los Mochis, Sinaloa

Sistema de reporte ciudadano y seguimiento administrativo de servicios públicos.

- **Móvil ciudadano:** Flutter (Android, APK) — construida en la Fase 3.
- **Web administrador:** React + Vite + Leaflet.
- **API:** Node.js + Express.
- **Base de datos:** MySQL / MariaDB (compatible con TiDB).

## Estado actual: Fase 5 completada

Fase 1:

- Esquema de base de datos con datos de prueba.
- Registro público de ciudadanos y login para `ADMIN` y `CIUDADANO`.
- JWT, bcrypt, rate limiting, Helmet y CORS.
- Middleware de autorización por rol y control de usuarios.
- Panel web con login exclusivo de administrador.

Fase 2:

- Catálogo de 9 categorías de servicios públicos.
- Alta de reportes con GPS automático validado contra Los Mochis.
- Evidencias fotográficas (JPEG/PNG/WebP, máximo 3 de 5 MB).
- “Mis reportes” con aislamiento estricto por ciudadano.
- Detalle con fotos, coordenadas y timeline de estados.
- Cambio de estado administrado con transiciones permitidas e historial.
- Mapa Leaflet con puntos exactos y filtros en el panel.
- Estadísticas por estado, categoría, prioridad y sector.

Fase 3:

- App Flutter ciudadana con tema teal/ámbar consistente con la web.
- Login, registro, perfil y cierre de sesión; token seguro en el dispositivo.
- Mapa público de `flutter_map` limitado a Los Mochis con filtro por categoría.
- Wizard de 4 pasos con GPS automático, ajuste manual del punto y hasta 3 fotos.
- “Mis reportes”, detalle con evidencias, coordenadas e historial de estados.
- APK release generado y `flutter analyze` / `flutter test` en verde.

Fase 4:

- Mapa público accesible sin sesión en `#/mapa-publico`, con métricas y lista de reportes.
- CTA de descarga del APK; el binario se genera en local y se coloca en `backend/downloads/` (no versionado).
- Clustering opcional de marcadores con `react-leaflet-cluster`.
- Filtro por rango de fechas en el panel administrativo.
- Exportación CSV con los filtros activos (solo `ADMIN`, BOM para Excel).
- Suite de integración ampliada y smoke tests de extremo a extremo.

Fase 5:

- Paleta, espaciados y microcopy alineados entre React y Flutter.
- Toasts accesibles, skeletons y estados vacíos con acción en ambos clientes.
- Modo claro/oscuro en la web, foco visible y navegación por teclado.
- Confirmación antes de rechazar o archivar un reporte.
- Pruebas de componentes UX y verificación responsive en móvil, tablet y escritorio.

## Estructura

```text
monitor_servicios_publicos/
├── BD.sql                       # Esquema + datos de prueba
├── docker-compose.yml           # MariaDB local en el puerto 3307
├── backend/
│   ├── src/
│   │   ├── config/              # DB, entorno y almacenamiento de fotos
│   │   ├── constants/           # Los Mochis, estados y transiciones
│   │   ├── controllers/         # auth, admin, categorías, reportes
│   │   ├── middleware/          # JWT, roles, rate limit, errores
│   │   ├── routes/              # /api/auth, /api/admin, /api/reportes...
│   │   └── uploads/             # Evidencias locales (ignorado por git)
│   ├── downloads/               # APK servido al mapa público (generado en local, ignorado)
│   ├── tests/                   # Suite de integración (133 pruebas)
│   └── setup_db.js              # Carga BD.sql
├── frontend/
│   └── src/components/          # Login, dashboard, mapa, reportes, mapa público
└── mobile/
    ├── lib/
    │   ├── config/              # URL de API y límites geográficos
    │   ├── models/              # Usuario, categoría, reporte e historial
    │   ├── providers/           # Sesión con Provider
    │   ├── screens/             # Splash, login, registro, mapa, wizard, etc.
    │   ├── services/            # ApiService y repositorios
    │   ├── theme/               # Paleta y tema Material 3
    │   └── widgets/             # Mapa y componentes compartidos
    └── build/app/outputs/flutter-apk/app-release.apk   # APK generado en local (ignorado)
```

## Requisitos

- Node.js 20+
- Podman o Docker (para la base de datos local)
- Flutter 3.x (solo si se quiere recompilar la app)

## Puesta en marcha

### 1. Base de datos

```bash
cd monitor_servicios_publicos
podman compose up -d
# o: docker compose up -d
```

La base queda expuesta en `127.0.0.1:3307` con usuario `root` y contraseña `root`.

### 2. Backend

```bash
cd backend
cp .env.example .env      # solo la primera vez
npm install
npm run db:setup          # crea la base y carga los datos de prueba
npm run dev               # http://localhost:3000
```

### 3. Panel administrativo

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

El panel tiene dos pestañas:

- **Resumen:** usuarios, estados y avance del proyecto.
- **Reportes:** tabla filtrable (estado, servicio, texto y rango de fechas), mapa con
  clustering opcional, exportación CSV, detalle, fotos, historial y cambio de estado.

El enlace **Ver mapa público de reportes** del login abre `#/mapa-publico`: una vista
sin autenticación con el mapa de Los Mochis, métricas, filtros y la descarga del APK.

### 4. App ciudadana (Flutter / Android)

El APK **no se versiona**: se genera en local antes de enviarlo a revisión.

```bash
cd mobile
flutter pub get
flutter build apk --release
```

Salida: `mobile/build/app/outputs/flutter-apk/app-release.apk`.

Para conectarlo a un backend distinto al emulador (`10.0.2.2:3000`):

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=http://192.168.1.10:3000
```

En un dispositivo físico usa la IP de tu máquina en la red local.
El dispositivo necesita permisos de ubicación y, si usas la cámara, permiso de cámara.

Comandos de calidad:

```bash
flutter analyze            # 0 issues
flutter test               # 1/1
```

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@servicios.test` | `Admin123!` |
| CIUDADANO | `ciudadano1@servicios.test` | `Ciudadano123!` |
| CIUDADANO | `ciudadano2@servicios.test` | `Ciudadano123!` |

La web solo permite el rol `ADMIN`. Las cuentas `CIUDADANO` son las que se usan en la app Flutter.

## Pruebas

```bash
cd backend
npm test
```

El runner es autocontenido: reinicia la base de prueba, levanta un backend aislado en el
puerto `3100` con `NODE_ENV=test`, ejecuta las suites y lo detiene al finalizar.

Resultado esperado: **133 pruebas, 0 fallos**.

Cobertura:

- **Fase 1:** login, roles, registro, perfil, contraseña, activación de usuarios y alcance geográfico.
- **Fase 2:** categorías, validación de coordenadas, alta con/sin fotos, límites de archivos,
  URLs de evidencias, mapa público, aislamiento de “mis reportes”, permisos de detalle,
  transiciones de estado, rechazos con motivo, historial, listado admin y estadísticas.
- **Fase 4:** autorización y filtros del CSV, BOM/UTF-8, fechas legibles y formato de descarga.

App Flutter:

```bash
cd mobile
flutter analyze
flutter test
flutter build apk --release
```

Resultado esperado: **0 issues**, **1/1 test** y APK en `build/app/outputs/flutter-apk/app-release.apk`.

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado de la API y la DB |
| GET | `/api/geo` | Centro, zoom y límites de Los Mochis |
| GET | `/api/categorias` | Catálogo de servicios públicos |
| GET | `/api/reportes` | Puntos activos para el mapa |
| GET | `/downloads/monitoreo-servicios.apk` | APK ciudadano (rango HTTP soportado) |

### Autenticados

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | Público | Crea siempre un `CIUDADANO` |
| POST | `/api/auth/login` | Público | Login de ambos roles |
| GET | `/api/auth/me` | Token | Sesión actual |
| PUT | `/api/auth/perfil` | Token | Nombre y teléfono |
| PUT | `/api/auth/password` | Token | Cambio de contraseña |
| POST | `/api/reportes` | Token | Alta (JSON o multipart `fotos`) |
| GET | `/api/reportes/mis-reportes` | Token | Solo los reportes propios |
| GET | `/api/reportes/:id` | Token | Propietario o admin |
| GET | `/api/reportes/:id/historial` | Token | Propietario o admin |

### Solo administrador

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/ping` | Verificación de rol |
| GET | `/api/admin/usuarios` | Listado de usuarios |
| PUT | `/api/admin/usuarios/:id/activo` | Activar/desactivar |
| GET | `/api/admin/resumen` | Resumen general |
| GET | `/api/reportes/admin/todos` | Reportes con filtros y paginación |
| GET | `/api/reportes/admin/exportar` | CSV con los filtros activos |
| GET | `/api/reportes/estadisticas` | Métricas por estado/categoría/sector |
| PATCH | `/api/reportes/:id/estado` | Cambio de estado e historial |

## Ciclo de vida de un reporte

```text
PENDIENTE ──→ EN_PROCESO ──→ COMPLETADO ──→ ARCHIVADO
    │              │
    └──────────────┴──────→ RECHAZADO ──→ ARCHIVADO
```

- Todo cambio se registra en `Reporte_Historial`.
- `COMPLETADO` y `RECHAZADO` establecen `fecha_cierre`.
- `RECHAZADO` exige un motivo y lo guarda en `motivo_rechazo`.
- Un ciudadano nunca puede cambiar estados.

## Evidencias fotográficas

- Almacenamiento local en `backend/uploads/reportes/` durante desarrollo.
- Se sirven en `/uploads/reportes/<archivo>` con URL absoluta según `BACKEND_URL`.
- Máximo 3 imágenes, 5 MB cada una, formatos JPEG, PNG y WebP.
- Nombres aleatorios (UUID); nunca se usa el nombre original.
- La función `guardarEvidencias` está aislada para sustituirla por Cloudinary en producción.

## Alcance geográfico

| Parámetro | Valor |
|---|---|
| Centro | `25.7904, -108.9858` |
| Zoom inicial | `13` |
| Latitud mínima | `25.70` |
| Latitud máxima | `25.88` |
| Longitud mínima | `-109.06` |
| Longitud máxima | `-108.91` |

Definidos en `backend/src/constants/geo.js` y expuestos en `GET /api/geo`.
El backend rechaza con `400` cualquier reporte fuera de estos límites.
La app Flutter usa las mismas constantes en `mobile/lib/config/app_config.dart` para
validar el GPS y restringir el mapa.

## Estado final

Fases 1 a 5 completadas. Queda como mejora opcional la Fase 6 del plan:

- Cloudinary en producción en lugar del almacenamiento local.
- Despliegue cloud de web, API y base de datos.
- Pruebas en dispositivo real y distribución del APK.
- Notificaciones push y panel de analistas (fuera del alcance actual).

### Verificación de la Fase 4

| Comando / prueba | Resultado |
|---|---|
| `cd backend && npm test` | **133/133** |
| `cd frontend && npm run build` | ✅ (CSS 41.98 kB, JS 443.97 kB) |
| Smoke test login → panel → reportes | 19 filas, sin errores de consola |
| Smoke test mapa público | 16 reportes, 7 clusters, filtro y CTA del APK |
| Exportación CSV con token admin | 200, `text/csv`, BOM y fechas `dd/mm/aaaa` |
| Descarga del APK (tras copiarlo en local) | 206 (rango), `application/vnd.android.package-archive` |
| `cd mobile && flutter analyze && flutter test` | 0 issues, 1/1 |

### Verificación de la Fase 5

| Comando / prueba | Resultado |
|---|---|
| `cd frontend && npm test` | ✅ 4 pruebas de UX (`Toast`, skeletons, estado vacío, tema) |
| `cd frontend && npm run build` | ✅ compilación sin errores |
| `cd mobile && flutter analyze` | Sin issues |
| `cd mobile && flutter test` | ✅ 4/4 (paleta, widgets y splash) |
| Revisión responsive | Móvil, tablet y escritorio sin desbordes |
| Accesibilidad | Foco visible, `aria-*`, `role="status"`, `prefers-reduced-motion` |

Para publicar el APK en el mapa público, genéralo en local y cópialo:

```bash
cd mobile
flutter build apk --release
cd ..
cp mobile/build/app/outputs/flutter-apk/app-release.apk \
   backend/downloads/monitoreo-servicios.apk
```

`backend/downloads/*.apk` está en `.gitignore`: el binario se envía por separado a revisión.
