import 'package:flutter/foundation.dart';

import '../models/usuario.dart';
import '../services/api_service.dart';
import '../services/session_service.dart';

class AuthProvider extends ChangeNotifier {
  Usuario? _usuario;
  String? _token;
  bool _inicializando = true;
  bool _cargando = false;
  String? _error;

  Usuario? get usuario => _usuario;
  String? get token => _token;
  bool get inicializando => _inicializando;
  bool get cargando => _cargando;
  String? get error => _error;
  bool get autenticado => _usuario != null && _token != null;

  Future<void> inicializar() async {
    final sesion = await SessionService.restaurarSesion();
    if (sesion != null) {
      _usuario = sesion;
      _token = await SessionService.obtenerToken();
    }
    _inicializando = false;
    notifyListeners();
  }

  Future<bool> login(String correo, String password) async {
    _cargando = true;
    _error = null;
    notifyListeners();

    try {
      final datos = await ApiService.post('/api/auth/login', {
        'correo': correo.trim(),
        'password': password,
      });

      final usuario = Usuario.fromJson(
        Map<String, dynamic>.from(datos['usuario'] ?? datos),
      );

      if (!usuario.esCiudadano) {
        throw const ApiException(
          'Esta app es exclusiva para ciudadanos. Usa el panel web para administradores.',
        );
      }

      final token = (datos['token'] ?? '').toString();
      if (token.isEmpty) {
        throw const ApiException('El servidor no devolvió una sesión válida.');
      }

      await SessionService.guardarToken(token);
      _usuario = usuario;
      _token = token;
      _cargando = false;
      notifyListeners();
      return true;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (error) {
      _error = 'No se pudo iniciar sesión: $error';
    }

    _cargando = false;
    notifyListeners();
    return false;
  }

  Future<bool> registro({
    required String nombre,
    required String correo,
    required String telefono,
    required String password,
  }) async {
    _cargando = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/api/auth/registro', {
        'nombre': nombre.trim(),
        'correo': correo.trim(),
        'telefono': telefono.trim(),
        'password': password,
      });

      _cargando = false;
      notifyListeners();
      return true;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (error) {
      _error = 'No se pudo registrar: $error';
    }

    _cargando = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await SessionService.cerrarSesion();
    _usuario = null;
    _token = null;
    _error = null;
    notifyListeners();
  }

  void limpiarError() {
    _error = null;
    notifyListeners();
  }
}
