# Monitoreo de Servicios Públicos — Los Mochis, Sinaloa

## Fases 1 y 2 — Autenticación, roles y reportes

- **Web administrador:** React + Vite + Leaflet.
- **API:** Node.js + Express.
- **Base de datos:** MySQL / MariaDB.

### Puesta en marcha

```bash
podman compose up -d    # o: docker compose up -d
cd backend && cp .env.example .env && npm install && npm run db:setup && npm run dev
cd ../frontend && npm install && npm run dev
```

### Funcionalidad de la Fase 2

- Catálogo de 9 categorías de servicios públicos.
- Alta de reportes con GPS validado contra Los Mochis.
- Evidencias fotográficas (JPEG/PNG/WebP, máximo 3 de 5 MB).
- “Mis reportes” con aislamiento por ciudadano.
- Detalle con fotos, coordenadas e historial de estados.
- Cambio de estado administrado con transiciones permitidas.
- Mapa Leaflet con puntos exactos y filtros en el panel.
- Estadísticas por estado, categoría, prioridad y sector.

### Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@servicios.test` | `Admin123!` |
| CIUDADANO | `ciudadano1@servicios.test` | `Ciudadano123!` |
| CIUDADANO | `ciudadano2@servicios.test` | `Ciudadano123!` |

### Verificación

```bash
cd backend && npm test    # 122 pruebas, 0 fallos
cd ../frontend && npm run build
```
