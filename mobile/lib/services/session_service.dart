import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/usuario.dart';
import 'api_service.dart';

class SessionService {
  SessionService._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';

  static Future<String?> obtenerToken() => _storage.read(key: _tokenKey);

  static Future<void> guardarToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<void> cerrarSesion() => _storage.delete(key: _tokenKey);

  static Future<Usuario?> restaurarSesion() async {
    final token = await obtenerToken();
    if (token == null || token.isEmpty) return null;

    try {
      final datos = await ApiService.get('/api/auth/me', token: token);
      final usuario = Usuario.fromJson(
        Map<String, dynamic>.from(datos['usuario'] ?? datos),
      );
      return usuario.esCiudadano ? usuario : null;
    } catch (_) {
      await cerrarSesion();
      return null;
    }
  }
}
