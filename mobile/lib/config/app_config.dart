/// Configuración de la app ciudadana.
///
/// La URL de la API se puede cambiar al compilar:
///   flutter build apk --dart-define=API_BASE_URL=http://192.168.1.10:3000
///
/// Por defecto se usa 10.0.2.2, que apunta al host desde el emulador Android.
class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const String appName = 'Monitoreo de Servicios Públicos';
  static const String ciudad = 'Los Mochis, Sinaloa';

  // Centro y límites de Los Mochis (deben coincidir con el backend).
  static const double centroLat = 25.7904;
  static const double centroLng = -108.9858;
  static const double zoomInicial = 13;
  static const double zoomMinimo = 12;
  static const double zoomMaximo = 18;

  static const double latMin = 25.70;
  static const double latMax = 25.88;
  static const double lngMin = -109.06;
  static const double lngMax = -108.91;

  static String url(String ruta) => '$apiBaseUrl$ruta';

  static bool dentroDeLosMochis(double lat, double lng) =>
      lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;

  static String mensajeFueraDeArea() =>
      'Tu ubicación está fuera del área de cobertura de Los Mochis';
}
