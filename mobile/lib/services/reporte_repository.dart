import '../models/categoria.dart';
import '../models/reporte.dart';
import '../services/api_service.dart';

class ReporteRepository {
  const ReporteRepository._();

  static Future<List<Categoria>> categorias() async {
    final datos = await ApiService.get('/api/categorias');
    final lista = datos['categorias'] is List
        ? datos['categorias'] as List
        : <dynamic>[];

    return lista
        .whereType<Map>()
        .map((item) => Categoria.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  static Future<Map<String, dynamic>> crear({
    required String token,
    required int categoriaId,
    required String titulo,
    required String descripcion,
    required String direccion,
    required double latitud,
    required double longitud,
    required List<String> fotos,
  }) async {
    final datos = await ApiService.postMultipart(
      '/api/reportes',
      {
        'id_categoria': categoriaId.toString(),
        'titulo': titulo,
        'descripcion': descripcion,
        'direccion_referencia': direccion,
        'latitud': latitud.toStringAsFixed(7),
        'longitud': longitud.toStringAsFixed(7),
      },
      fotos,
      token: token,
    );

    return Map<String, dynamic>.from(datos as Map);
  }

  static Future<List<Reporte>> misReportes(String token) async {
    final datos = await ApiService.get(
      '/api/reportes/mis-reportes',
      token: token,
    );
    final lista = datos['reportes'] is List
        ? datos['reportes'] as List
        : <dynamic>[];

    return lista
        .whereType<Map>()
        .map((item) => Reporte.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  static Future<Map<String, dynamic>> detalle(int id, String token) async {
    final datos = await ApiService.get('/api/reportes/$id', token: token);
    final mapa = Map<String, dynamic>.from(datos as Map);

    final historial = <HistorialEvento>[];
    if (mapa['historial'] is List) {
      for (final evento in mapa['historial'] as List) {
        if (evento is Map) {
          historial.add(
            HistorialEvento.fromJson(Map<String, dynamic>.from(evento)),
          );
        }
      }
    }

    return {
      'reporte': Reporte.fromJson(
        Map<String, dynamic>.from(mapa['reporte'] ?? mapa),
      ),
      'historial': historial,
    };
  }
}
