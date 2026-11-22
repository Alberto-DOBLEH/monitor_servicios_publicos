# Monitoreo de Servicios Públicos — Los Mochis, Sinaloa

## Fase 1 — Base de datos, autenticación y roles

Sistema de reporte ciudadano y seguimiento administrativo de servicios públicos.

- **Web administrador:** React + Vite.
- **API:** Node.js + Express.
- **Base de datos:** MySQL / MariaDB.

### Puesta en marcha

```bash
podman compose up -d    # o: docker compose up -d
cd backend && cp .env.example .env && npm install && npm run db:setup && npm run dev
cd ../frontend && npm install && npm run dev
```

### Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@servicios.test` | `Admin123!` |
| CIUDADANO | `ciudadano1@servicios.test` | `Ciudadano123!` |

La web solo permite `ADMIN`. El registro público crea siempre `CIUDADANO`.

### Verificación

```bash
cd backend && npm test
```

Incluye login, roles, registro, perfil, contraseña, activación de usuarios y
alcance geográfico de Los Mochis.
