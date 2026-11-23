# Mobile — App ciudadana Flutter (Android)

Aplicación móvil para **ciudadanos**: consultar el mapa público, registrarse, enviar
reportes con GPS y fotos, y monitorizar **solo sus propios reportes**. El entregable es un
APK de Android; el binario no se versiona.

Volver al [README raíz](../README.md).

## Índice

| Sección | Contenido |
|---|---|
| [Propósito](#propósito) | Funcionalidades y límite de roles |
| [Stack](#stack) | Paquetes y versiones |
| [Prerrequisitos](#prerrequisitos) | Flutter, Android y backend |
| [Instalación](#instalación) | `flutter pub get` y URL de API |
| [Comandos](#comandos) | Ejecutar, analizar, probar y compilar APK |
| [Configuración](#configuración) | `API_BASE_URL` y permisos |
| [Funcionalidades](#funcionalidades) | Flujo ciudadano |
| [Pruebas](#pruebas) | Resultado esperado |
| [Estructura](#estructura) | Mapa de carpetas |
| [Solución de problemas](#solución-de-problemas) | Errores frecuentes |

## Propósito

- Registro e inicio de sesión de ciudadanos; token guardado con `flutter_secure_storage`.
- Mapa de Los Mochis con `flutter_map` y filtro por categoría.
- Asistente de 4 pasos: categoría, descripción/ubicación, fotos y confirmación.
- GPS automático validado contra los límites de Los Mochis, con ajuste manual del punto.
- Hasta 3 fotos JPEG/PNG/WebP de 5 MB como máximo.
- “Mis reportes”, detalle con evidencias, coordenadas, historial y estado.
- Perfil: nombre, teléfono y cambio de contraseña.

La app **no** gestiona usuarios ni cambia estados: eso es exclusivo del panel web `ADMIN`.

## Stack

| Paquete | Uso |
|---|---|
| Flutter 3 / Dart `^3.13.2` | Framework y SDK |
| provider | Estado de autenticación |
| http | Cliente de la API |
| flutter_secure_storage | Token JWT en el dispositivo |
| flutter_map + latlong2 | Mapa y coordenadas |
| geolocator | GPS y permisos de ubicación |
| image_picker | Cámara y galería |
| cached_network_image | Caché de evidencias |
| intl | Formato de fechas |
| flutter_lints | Análisis estático |

## Prerrequisitos

1. Flutter 3.x con Dart `^3.13.2` (`flutter --version`).
2. Android SDK y emulador, o dispositivo físico con depuración USB.
3. Backend de la [API](../backend/README.md) accesible desde el dispositivo.

## Instalación

```bash
cd mobile
flutter pub get
```

Por defecto la app apunta a `http://10.0.2.2:3000` (el host desde el emulador Android).
Para un dispositivo físico usa la IP de tu máquina en la red local:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000
```

## Comandos

| Comando | Descripción |
|---|---|
| `flutter pub get` | Descarga dependencias |
| `flutter run` | Ejecuta en emulador/dispositivo |
| `flutter analyze` | Análisis estático (0 issues) |
| `flutter test` | Suite de pruebas |
| `flutter build apk --release` | Genera el APK release |

Salida del APK:

```text
mobile/build/app/outputs/flutter-apk/app-release.apk
```

Para publicarlo en el mapa público de la web:

```bash
# desde la raíz del repositorio
cp mobile/build/app/outputs/flutter-apk/app-release.apk \
   backend/downloads/monitoreo-servicios.apk
```

El binario está en `.gitignore`: se envía a revisión por separado.

## Configuración

Todo se define en `mobile/lib/config/app_config.dart` mediante `dart-define`:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `API_BASE_URL` | `http://10.0.2.2:3000` | Base de la API; sin barra final |

Constantes geográficas (deben coincidir con el backend):

| Parámetro | Valor |
|---|---|
| Centro | `25.7904, -108.9858` |
| Zoom inicial / mín / máx | `13 / 12 / 18` |
| Latitud | `25.70` a `25.88` |
| Longitud | `-109.06` a `-108.91` |

Permisos declarados en `android/app/src/main/AndroidManifest.xml`: `INTERNET`,
`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` y permisos de cámara/galería según API.
En Android 6+ los permisos peligrosos se solicitan en tiempo de ejecución.

## Funcionalidades

Flujo ciudadano típico:

```text
Splash → Login / Registro → Home →(Mapa|Nuevo reporte|Mis reportes|Perfil)
                                      │
                                      └─ Detalle del reporte
```

- El alta de reportes está limitada al rectángulo de Los Mochis; fuera de él se muestra
  un aviso y no se envía.
- El historial de estados es de solo lectura para el ciudadano.
- Los mensajes de error de la API se muestran en SnackBars y estados vacíos con acción.

## Pruebas

```bash
cd mobile
flutter analyze
flutter test
```

Resultado esperado: **0 issues** y **5 pruebas, 0 fallos**:

- `test/widget_test.dart`: pantalla de carga inicial.
- `test/ux_test.dart`: paleta Flutter alineada con la web, estado vacío accesible y esqueletos de carga.
- `test/layout_responsive_test.dart`: detecta overflow de layout en 360, 390 y 820 px
  para login, registro, home, mis reportes, detalle, nuevo reporte y perfil.

> El test de layout usa una sesión falsa y no necesita backend ni token real.
> Las excepciones de plugins no disponibles en el entorno de test (`geolocator`,
> `image_picker`) se ignoran deliberadamente: solo se comprueba el layout.

## Estructura

```text
mobile/
├── pubspec.yaml
├── android/                 # Configuración Android y permisos
├── lib/
│   ├── main.dart            # Arranque, Provider y rutas
│   ├── config/app_config.dart
│   ├── models/              # Usuario, Categoría, Reporte, Historial
│   ├── providers/auth_provider.dart
│   ├── services/            # api_service.dart y repositorios
│   ├── screens/             # splash, login, registro, home, mapa,
│   │                        # nuevo_reporte, mis_reportes, detalle, perfil
│   ├── theme/app_theme.dart # Paleta teal/ámbar alineada con la web
│   └── widgets/             # common.dart (estados vacíos, skeletons, SnackBars)
└── test/                    # 5 pruebas
```

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| La app no conecta | URL de API incorrecta para el emulador/dispositivo | Pasa `--dart-define=API_BASE_URL=...` |
| “Ubicación fuera del área” | El GPS está fuera de Los Mochis | Activa el GPS y acércate al área; ajusta el punto manualmente |
| Permiso de ubicación denegado | Permiso no concedido o bloqueado | Acepta el permiso o habilítalo en Ajustes |
| La cámara no abre | Permiso de cámara no concedido | Concédelo en Ajustes; usa la galería como alternativa |
| `MissingPluginException` en `flutter test` | Plugins nativos no disponibles en tests | Es esperado; el test de layout lo filtra |
| Build falla por Gradle | Caché corrupta o SDK incompleto | `flutter clean && flutter pub get` y verifica el Android SDK |
| El mapa no carga teselas | Sin conexión a internet | Conecta el dispositivo a la red |
