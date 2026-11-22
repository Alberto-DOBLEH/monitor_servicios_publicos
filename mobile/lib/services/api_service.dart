import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiService {
  ApiService._();

  static final http.Client _cliente = http.Client();

  static Map<String, String> _headers(String? token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
  };

  static Future<dynamic> get(String ruta, {String? token}) => _ejecutar(
    () =>
        _cliente.get(Uri.parse(AppConfig.url(ruta)), headers: _headers(token)),
  );

  static Future<dynamic> post(
    String ruta,
    Map<String, dynamic> cuerpo, {
    String? token,
  }) => _ejecutar(
    () => _cliente.post(
      Uri.parse(AppConfig.url(ruta)),
      headers: _headers(token),
      body: jsonEncode(cuerpo),
    ),
  );

  static Future<dynamic> put(
    String ruta,
    Map<String, dynamic> cuerpo, {
    String? token,
  }) => _ejecutar(
    () => _cliente.put(
      Uri.parse(AppConfig.url(ruta)),
      headers: _headers(token),
      body: jsonEncode(cuerpo),
    ),
  );

  static Future<dynamic> patch(
    String ruta,
    Map<String, dynamic> cuerpo, {
    String? token,
  }) => _ejecutar(
    () => _cliente.patch(
      Uri.parse(AppConfig.url(ruta)),
      headers: _headers(token),
      body: jsonEncode(cuerpo),
    ),
  );

  /// Alta de reporte con evidencias fotográficas.
  static Future<dynamic> postMultipart(
    String ruta,
    Map<String, String> campos,
    List<String> rutasFotos, {
    String? token,
  }) async {
    try {
      final peticion = http.MultipartRequest(
        'POST',
        Uri.parse(AppConfig.url(ruta)),
      );

      peticion.fields.addAll(campos);
      peticion.headers['Accept'] = 'application/json';
      if (token != null && token.isNotEmpty) {
        peticion.headers['Authorization'] = 'Bearer $token';
      }

      for (final ruta in rutasFotos) {
        if (ruta.isEmpty || !File(ruta).existsSync()) continue;
        peticion.files.add(await http.MultipartFile.fromPath('fotos', ruta));
      }

      final respuesta = await peticion.send();
      return _procesar(await http.Response.fromStream(respuesta));
    } on ApiException {
      rethrow;
    } on SocketException {
      throw const ApiException(
        'No se pudo conectar con el servidor. Revisa tu conexión y la URL de la API.',
      );
    } catch (error) {
      throw ApiException('No se pudo enviar el reporte: $error');
    }
  }

  static Future<dynamic> _ejecutar(
    Future<http.Response> Function() accion,
  ) async {
    try {
      final respuesta = await accion();
      return _procesar(respuesta);
    } on ApiException {
      rethrow;
    } on SocketException {
      throw const ApiException(
        'No se pudo conectar con el servidor. Revisa tu conexión y la URL de la API.',
      );
    } catch (error) {
      throw ApiException('Error de comunicación: $error');
    }
  }

  static dynamic _procesar(http.Response respuesta) {
    dynamic datos;

    if (respuesta.body.isNotEmpty) {
      try {
        datos = jsonDecode(respuesta.body);
      } catch (_) {
        if (respuesta.statusCode >= 200 && respuesta.statusCode < 300) {
          return <String, dynamic>{};
        }
        throw ApiException(
          'El servidor devolvió una respuesta inválida.',
          statusCode: respuesta.statusCode,
        );
      }
    }

    if (respuesta.statusCode >= 200 && respuesta.statusCode < 300) {
      return datos ?? <String, dynamic>{};
    }

    final mensaje = datos is Map
        ? (datos['error'] ??
              datos['mensaje'] ??
              'No se pudo completar la solicitud')
        : 'No se pudo completar la solicitud (${respuesta.statusCode})';

    throw ApiException(mensaje.toString(), statusCode: respuesta.statusCode);
  }
}
