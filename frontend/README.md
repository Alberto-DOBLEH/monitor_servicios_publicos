# Frontend — Panel administrativo y mapa público

Cliente web React: panel exclusivo para `ADMIN` con gestión de reportes y una vista pública
sin login que muestra los reportes geolocalizados y permite descargar el APK ciudadano.

Volver al [README raíz](../README.md).

## Índice

| Sección | Contenido |
|---|---|
| [Propósito](#propósito) | Qué incluye la web y qué queda fuera |
| [Stack](#stack) | Dependencias principales |
| [Prerrequisitos](#prerrequisitos) | Qué debe estar corriendo antes |
| [Instalación y ejecución](#instalación-y-ejecución) | Comandos locales |
| [Variables y configuración](#variables-y-configuración) | API, proxy Vite y almacenamiento local |
| [Vistas y rutas](#vistas-y-rutas) | Dashboard, reportes y mapa público |
| [Comandos](#comandos) | dev / build / preview / test |
| [Pruebas](#pruebas) | Resultado esperado y qué cubren |
| [Accesibilidad y tema](#accesibilidad-y-tema) | Modo oscuro, foco y responsive |
| [Estructura](#estructura) | Mapa de archivos |
| [Solución de problemas](#solución-de-problemas) | Errores frecuentes |

## Propósito

- **Panel admin** (`ADMIN`): resumen, usuarios, tabla de reportes filtrable, mapa Leaflet
  con clustering, detalle con fotos e historial, cambio de estado y exportación CSV.
- **Mapa público** (sin sesión): métricas, lista de reportes, filtros y CTA de descarga
  del APK. Accesible desde el enlace del login con `#/mapa-publico`.
- Los ciudadanos **no** inician sesión aquí; usan la [app Flutter](../mobile/README.md).

## Stack

| Dependencia | Uso |
|---|---|
| React 19 | Interfaz de usuario |
| Vite 8 | Servidor de desarrollo y build |
| Leaflet + react-leaflet 5 | Mapas e interacción con marcadores |
| react-leaflet-cluster 4 | Agrupación de marcadores |
| Vitest + Testing Library + jsdom | Pruebas de componentes |

## Prerrequisitos

1. Node.js 20+ y npm.
2. Backend corriendo en `http://localhost:3000` (ver [backend/README.md](../backend/README.md)).
3. MariaDB activa y con datos cargados (`npm run db:setup`).

## Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**. Usa `localhost`, no `127.0.0.1`: el backend solo permite
ese origen CORS. El proxy de Vite reenvía `/api` a `http://localhost:3000`.

## Variables y configuración

No hace falta un `.env` para trabajar en local. La configuración está en
`frontend/src/config.js` y `frontend/vite.config.js`:

| Variable / ajuste | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `""` (vacía) | Prefijo opcional de la API. Vacío significa usar el proxy `/api` |
| `API_BASE_URL` | `VITE_API_URL` sin barra final | Base de las peticiones |
| `APK_URL` | `${API_BASE_URL}/downloads/monitoreo-servicios.apk` | Enlace de descarga del APK |
| Proxy `/api` | `http://localhost:3000` | Destino en desarrollo |
| Puerto dev | `5173` | Configurado en Vite |

Si levantas la API en otra dirección:

```bash
VITE_API_URL=http://localhost:4000 npm run dev
```

Almacenamiento local del navegador:

| Clave | Ubicación | Contenido |
|---|---|---|
| `msp_admin_token` | `sessionStorage` | JWT del administrador |
| `msp_tema` | `localStorage` | `claro` u `oscuro` |

## Vistas y rutas

La app usa el hash de la URL:

| Ruta | Acceso | Contenido |
|---|---|---|
| *(sin hash)* | Requiere `ADMIN` | Login; tras autenticarse, dashboard con pestañas |
| `#/mapa-publico` | Público | Mapa, métricas, filtros y descarga del APK |

Dentro del dashboard:

- **Resumen:** indicadores, usuarios, estados y avance del proyecto.
- **Reportes:** tabla filtrable (estado, servicio, texto, rango de fechas), mapa con
  clustering opcional, exportación CSV, detalle, fotos, historial y cambio de estado.

El cambio de estado a `RECHAZADO` o `ARCHIVADO` pide confirmación y motivo.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en `:5173` |
| `npm run build` | Genera `dist/` para producción |
| `npm run preview` | Sirve localmente el build |
| `npm test` | Ejecuta Vitest en modo `run` |

## Pruebas

```bash
cd frontend
npm test
```

Resultado esperado: **6 pruebas, 0 fallos** en dos archivos:

- `src/tests/ux.test.jsx`: toasts, skeletons, estado vacío y toggle de tema.
- `src/tests/estado.test.jsx`: validación del motivo de rechazo y confirmación accesible.

Verificación adicional recomendada:

```bash
npm run build
```

## Accesibilidad y tema

- Modo claro/oscuro con `:root[data-tema="oscuro"]`; el botón alterna `msp_tema`.
- Contraste verificado en login, dashboard, reportes, detalle y mapa público en ambos temas.
- Foco visible (`:focus-visible`), enlace “saltar al contenido”, `role`/`aria-*` en
  alertas y estados, y `prefers-reduced-motion`.
- Diseño responsive probado en 390 px, 820 px y 1440 px.
- Los botones y pestañas tienen áreas táctiles mínimas de 40 px.

## Estructura

```text
frontend/
├── index.html
├── vite.config.js          # Plugin React, puerto 5173, proxy /api
├── vitest.config.js        # jsdom + patrones src/tests/**/*.test.jsx
└── src/
    ├── main.jsx
    ├── App.jsx             # Enrutado por hash y proveedores
    ├── config.js           # API_BASE_URL, APK_URL
    ├── hooks/useTema.js    # Persistencia del tema
    ├── context/AuthContext.jsx
    ├── services/api.js     # apiFetch con token JWT
    ├── components/
    │   ├── LoginAdmin.jsx
    │   ├── AdminDashboard.jsx
    │   ├── PanelReportes.jsx
    │   ├── ReporteDetalle.jsx
    │   ├── MapaReportes.jsx
    │   ├── MapaPublico.jsx
    │   ├── Toast.jsx / Skeleton.jsx / EstadoVacio.jsx / BotonTema.jsx
    ├── style.css           # Paleta, tema oscuro, responsive y accesibilidad
    └── tests/              # 6 pruebas
```

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Bloqueado por CORS` al entrar | Se abrió `127.0.0.1:5173` | Usa `http://localhost:5173` |
| Pantalla en blanco | Error en API o token inválido | Revisa consola y que el backend responda `/health` |
| “Verificando sesión…” se queda colgado | Backend caído o token expirado | Reinicia la API; vuelve a iniciar sesión |
| Mapa sin teselas | Sin conexión o filtro del tema oscuro | Verifica red; el filtro se aplica solo en modo oscuro |
| Botón de APK da 404 | Falta el binario | Copia el APK a `backend/downloads/` (ver [README raíz](../README.md#apk-ciudadano)) |
| Imágenes de evidencia rotas | Archivos no presentes o URLs externas de prueba | Revisa `backend/uploads/reportes/` y `BACKEND_URL` |
