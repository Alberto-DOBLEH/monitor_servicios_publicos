import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../config/app_config.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

class PerfilScreen extends StatefulWidget {
  const PerfilScreen({super.key});

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  final _formulario = GlobalKey<FormState>();
  final _nombre = TextEditingController();
  final _telefono = TextEditingController();
  final _passwordActual = TextEditingController();
  final _passwordNueva = TextEditingController();
  bool _cargando = false;
  String? _mensaje;
  String? _error;

  @override
  void initState() {
    super.initState();
    final usuario = context.read<AuthProvider>().usuario;
    _nombre.text = usuario?.nombre ?? '';
    _telefono.text = usuario?.telefono ?? '';
  }

  @override
  void dispose() {
    _nombre.dispose();
    _telefono.dispose();
    _passwordActual.dispose();
    _passwordNueva.dispose();
    super.dispose();
  }

  Future<void> _guardarPerfil() async {
    if (!_formulario.currentState!.validate()) return;

    final token = context.read<AuthProvider>().token;
    if (token == null) return;

    setState(() {
      _cargando = true;
      _mensaje = null;
      _error = null;
    });

    try {
      await ApiService.put(
        '/api/auth/perfil',
        {'nombre': _nombre.text.trim(), 'telefono': _telefono.text.trim()},
        token: token,
      );
      setState(() => _mensaje = 'Datos actualizados correctamente');
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _cargando = false);
    }
  }

  Future<void> _cambiarPassword() async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;

    if (_passwordActual.text.isEmpty || _passwordNueva.text.length < 8) {
      setState(() => _error = 'Revisa las contraseñas (mínimo 8 caracteres)');
      return;
    }

    setState(() {
      _cargando = true;
      _mensaje = null;
      _error = null;
    });

    try {
      await ApiService.put(
        '/api/auth/password',
        {
          'password_actual': _passwordActual.text,
          'password_nueva': _passwordNueva.text,
        },
        token: token,
      );
      _passwordActual.clear();
      _passwordNueva.clear();
      setState(() => _mensaje = 'Contraseña actualizada');
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final usuario = context.watch<AuthProvider>().usuario;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primaryDark, AppColors.primary],
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(
                  usuario?.nombre.isNotEmpty == true
                      ? usuario!.nombre[0].toUpperCase()
                      : 'C',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      usuario?.nombre ?? 'Ciudadano',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      usuario?.correo ?? '',
                      style: const TextStyle(
                        color: Color(0xCCFFFFFF),
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Icon(Icons.verified, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Cuenta ciudadana activa',
                          style: TextStyle(color: Colors.white, fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const SeccionTitulo(
          titulo: 'Datos personales',
          icono: Icons.person_outline,
        ),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formulario,
              child: Column(
                children: [
                  TextFormField(
                    controller: _nombre,
                    decoration: const InputDecoration(
                      labelText: 'Nombre completo',
                      prefixIcon: Icon(Icons.badge_outlined),
                    ),
                    validator: (valor) => valor == null || valor.trim().length < 3
                        ? 'Ingresa tu nombre'
                        : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _telefono,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Teléfono',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _cargando ? null : _guardarPerfil,
                    child: const Text('Guardar cambios'),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        const SeccionTitulo(
          titulo: 'Seguridad',
          icono: Icons.lock_outline,
          color: AppColors.amber,
        ),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextFormField(
                  controller: _passwordActual,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña actual',
                    prefixIcon: Icon(Icons.key_outlined),
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordNueva,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Nueva contraseña',
                    prefixIcon: Icon(Icons.lock_reset_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: _cargando ? null : _cambiarPassword,
                  child: const Text('Actualizar contraseña'),
                ),
              ],
            ),
          ),
        ),
        if (_mensaje != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _mensaje!,
              style: const TextStyle(color: AppColors.success, fontSize: 12),
            ),
          ),
        ],
        if (_error != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _error!,
              style: const TextStyle(color: AppColors.danger, fontSize: 12),
            ),
          ),
        ],
        const SizedBox(height: 28),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SeccionTitulo(
                  titulo: 'Cobertura de la app',
                  icono: Icons.location_city_outlined,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Esta plataforma atiende únicamente reportes dentro de Los Mochis, Sinaloa.',
                  style: TextStyle(color: AppColors.muted, fontSize: 12),
                ),
                const SizedBox(height: 10),
                Text(
                  'Miembro desde ${usuario?.fechaRegistro != null ? DateFormat('dd MMM yyyy', 'es_MX').format(usuario!.fechaRegistro!) : '—'}',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11),
                ),
                const SizedBox(height: 4),
                Text(
                  AppConfig.apiBaseUrl,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 10,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
