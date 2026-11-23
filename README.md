# Monitoreo de Servicios Públicos — Los Mochis, Sinaloa

Sistema de **reporte ciudadano** y **seguimiento administrativo** de servicios públicos.
Los ciudadanos reportan desde la app Flutter (Android); los administradores gestionan y
visualizan los reportes en la web React. Todo el proyecto usa **datos de prueba**.

## Índice — lectura rápida

| Sección | Contenido |
|---|---|
| [Documentación por módulo](#documentación-por-módulo) | Enlaces directos a los README de `backend/`, `frontend/` y `mobile/` |
| [Arquitectura](#arquitectura) | Componentes, puertos y flujo de datos |
| [Requisitos](#requisitos) | Versiones y herramientas necesarias |
| [Arranque rápido](#arranque-rápido) | Orden exacto para levantar todo en local |
| [Credenciales de prueba](#credenciales-de-prueba) | Usuarios `ADMIN` y `CIUDADANO` |
| [Verificación](#verificación) | Comandos y resultados esperados |
| [Endpoints](#endpoints) | API pública, autenticada y solo administrador |
| [Ciclo de vida de un reporte](#ciclo-de-vida-de-un-reporte) | Transiciones de estado permitidas |
| [APK ciudadano](#apk-ciudadano) | Cómo generarlo y dónde colocarlo |
| [Estado del proyecto](#estado-del-proyecto) | Fases completadas y trabajo opcional |

## Documentación por módulo

Cada carpeta tiene su propio README con propósito, stack, dependencias, instalación,
variables de entorno, comandos, pruebas, estructura y solución de problemas:

| Módulo | README | Resumen |
|---|---|---|
| `backend/` | [backend/README.md](backend/README.md) | API Node/Express, MariaDB, JWT, roles, evidencias y CSV |
| `frontend/` | [frontend/README.md](frontend/README.md) | Web React admin + mapa público Leaflet, tema claro/oscuro |
| `mobile/` | [mobile/README.md](mobile/README.md) | App Flutter ciudadana, GPS, fotos, APK release |

## Arquitectura

```text
 App Flutter (CIUDADANO) ──┐
                           ├──► API Express :3000 ──► MariaDB :3307
 Web React (ADMIN) ────────┘          │
   + mapa público sin sesión          └──► /uploads/reportes (evidencias)
                                          /downloads/*.apk (binario local)
```

| Componente | Tecnología | Rol |
|---|---|---|
| `mobile/` | Flutter 3 / Dart | Alta de reportes, GPS, fotos, “mis reportes”, perfil |
| `frontend/` | React 19 + Vite 8 + Leaflet | Panel exclusivo de `ADMIN` y mapa público sin sesión |
| `backend/` | Node.js + Express 5 | Autenticación JWT, roles, reportes, estados, CSV |
| `BD.sql` | MariaDB 11 | Esquema y datos de prueba |
| `docker-compose.yml` | MariaDB en `3307` | Base de datos local |

> La web **solo permite `ADMIN`**. Los ciudadanos **solo existen en la app móvil** y
> únicamente pueden ver y monitorizar **sus propios reportes**.

## Requisitos

- Node.js **20+** y npm.
- Podman o Docker (para el contenedor de MariaDB).
- Flutter **3.x** (Dart SDK `^3.13.2`) solo si se recompila la app.

## Arranque rápido

```bash
# 1) Base de datos (127.0.0.1:3307, root/root)
podman compose up -d        # o: docker compose up -d

# 2) API
cd backend
cp .env.example .env        # solo la primera vez
npm install
npm run db:setup            # crea la base y carga datos de prueba
npm run dev                 # http://localhost:3000

# 3) Web administrativa (en otra terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173

# 4) App ciudadana (opcional, en otra terminal)
cd mobile
flutter pub get
flutter run                 # o: flutter build apk --release
```

Usa **`localhost:5173`**, no `127.0.0.1:5173`: el backend solo permite ese origen CORS.

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| `ADMIN` | `admin@servicios.test` | `Admin123!` |
| `CIUDADANO` | `ciudadano1@servicios.test` | `Ciudadano123!` |
| `CIUDADANO` | `ciudadano2@servicios.test` | `Ciudadano123!` |

## Verificación

| Comando | Resultado esperado |
|---|---|
| `cd backend && npm test` | **133/133** pruebas (reinicia la BD de prueba) |
| `cd frontend && npm test` | **6/6** pruebas (UX y regresión de rechazo) |
| `cd frontend && npm run build` | Compilación correcta |
| `cd mobile && flutter analyze` | **0 issues** |
| `cd mobile && flutter test` | **5/5** pruebas (incluye layout responsive) |

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado de la API y la DB |
| GET | `/api/geo` | Centro, zoom y límites de Los Mochis |
| GET | `/api/categorias` | Catálogo de 9 servicios públicos |
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
- `RECHAZADO` exige un motivo (`motivo_rechazo`).
- Un ciudadano **nunca** puede cambiar estados.

## Evidencias fotográficas

- Almacenamiento local en `backend/uploads/reportes/` durante desarrollo.
- Se sirven en `/uploads/reportes/<archivo>` con URL absoluta según `BACKEND_URL`.
- Máximo 3 imágenes, 5 MB cada una, formatos JPEG/PNG/WebP.
- Nombres aleatorios (UUID); nunca se usa el nombre original.
- `guardarEvidencias` está aislada para sustituirla por Cloudinary en producción.

## Alcance geográfico

| Parámetro | Valor |
|---|---|
| Centro | `25.7904, -108.9858` |
| Zoom inicial | `13` |
| Latitud | `25.70` a `25.88` |
| Longitud | `-109.06` a `-108.91` |

Definido en `backend/src/constants/geo.js` y `mobile/lib/config/app_config.dart`.
El backend rechaza con `400` cualquier reporte fuera de este rectángulo.

## APK ciudadano

El binario **no se versiona**. Se genera en local y se envía por separado a revisión:

```bash
cd mobile
flutter pub get
flutter build apk --release
cd ..
cp mobile/build/app/outputs/flutter-apk/app-release.apk \
   backend/downloads/monitoreo-servicios.apk
```

Salida: `mobile/build/app/outputs/flutter-apk/app-release.apk`.
`backend/downloads/*.apk` está en `.gitignore`.

Para apuntar a otro backend:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=http://192.168.1.10:3000
```

## Estado del proyecto

Fases **1 a 5 completadas**: base de datos y autenticación, reportes y mapa,
app Flutter, mapa público/CSV y consistencia visual + accesibilidad.

Mejoras opcionales pendientes (Fase 6 del plan maestro): Cloudinary en producción,
despliegue cloud, pruebas en dispositivo real/distribución del APK y notificaciones push.
