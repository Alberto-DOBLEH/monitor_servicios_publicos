# Monitoreo de Servicios Públicos — Los Mochis, Sinaloa

## Fases 1 a 3 — Web, API y app ciudadana

- **Móvil ciudadano:** Flutter (Android, APK) — **Fase 3**.
- **Web administrador:** React + Vite + Leaflet.
- **API:** Node.js + Express.
- **Base de datos:** MySQL / MariaDB.

### Fase 3 — App Flutter

- Proyecto Android con `applicationId` `com.monitoreo.servicios.monitor_servicios_publicos`.
- Tema Material 3 con la paleta teal/ámbar del panel React.
- Login, registro, perfil y cierre de sesión; token con `flutter_secure_storage`.
- Mapa público con `flutter_map` limitado a Los Mochis.
- Wizard de 4 pasos: servicio, detalles, ubicación/evidencias y revisión.
- GPS con `geolocator`, ajuste manual del punto y hasta 3 fotos.
- “Mis reportes” con filtros y detalle con fotos, coordenadas e historial.

### Puesta en marcha

```bash
podman compose up -d    # o: docker compose up -d
cd backend && cp .env.example .env && npm install && npm run db:setup && npm run dev
cd ../frontend && npm install && npm run dev
cd ../mobile && flutter pub get && flutter run
```

### Compilar el APK

```bash
cd mobile
flutter build apk --release
# En dispositivo físico:
flutter build apk --release --dart-define=API_BASE_URL=http://192.168.1.10:3000
```

Salida: `mobile/build/app/outputs/flutter-apk/app-release.apk`.
Por defecto la app apunta a `http://10.0.2.2:3000` (emulador Android).

### Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| ADMIN | `admin@servicios.test` | `Admin123!` |
| CIUDADANO | `ciudadano1@servicios.test` | `Ciudadano123!` |
| CIUDADANO | `ciudadano2@servicios.test` | `Ciudadano123!` |

La web solo permite `ADMIN`; las cuentas `CIUDADANO` son para la app Flutter.

### Verificación

```bash
cd backend && npm test           # 122 pruebas, 0 fallos
cd ../frontend && npm run build
cd ../mobile && flutter analyze && flutter test
```
