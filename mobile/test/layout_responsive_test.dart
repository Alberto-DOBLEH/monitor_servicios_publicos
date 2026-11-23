import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:monitor_servicios_publicos/models/usuario.dart';
import 'package:monitor_servicios_publicos/providers/auth_provider.dart';
import 'package:monitor_servicios_publicos/screens/home_screen.dart';
import 'package:monitor_servicios_publicos/screens/login_screen.dart';
import 'package:monitor_servicios_publicos/screens/mis_reportes_screen.dart';
import 'package:monitor_servicios_publicos/screens/nuevo_reporte_screen.dart';
import 'package:monitor_servicios_publicos/screens/perfil_screen.dart';
import 'package:monitor_servicios_publicos/screens/registro_screen.dart';
import 'package:monitor_servicios_publicos/screens/reporte_detalle_screen.dart';
import 'package:monitor_servicios_publicos/theme/app_theme.dart';

/// Sesión falsa para rendering sin depender de la API ni de un token real.
class _AuthPrueba extends AuthProvider {
  @override
  Usuario? get usuario => const Usuario(
    idUsuario: 2,
    nombre: 'Ana López',
    correo: 'ciudadano1@servicios.test',
    telefono: '6681234567',
    rol: 'CIUDADANO',
    activo: true,
  );

  @override
  String? get token => 'token-de-prueba';

  @override
  bool get autenticado => true;

  @override
  bool get inicializando => false;
}

void main() {
  testWidgets(
    'las pantallas no presentan overflow en móvil, tablet ni escritorio',
    (tester) async {
      final pantallas = <String, Widget>{
        'login': const LoginScreen(),
        'registro': const RegistroScreen(),
        'home': const HomeScreen(),
        'mis_reportes': const MisReportesScreen(),
        'detalle': const ReporteDetalleScreen(idReporte: 19),
        'nuevo_reporte': const NuevoReporteScreen(),
        'perfil': const PerfilScreen(),
      };
      const tamanos = [
        Size(360, 640),
        Size(390, 844),
        Size(820, 1180),
      ];
      final problemas = <String>[];

      for (final tamano in tamanos) {
        for (final entrada in pantallas.entries) {
          tester.view.physicalSize = tamano;
          tester.view.devicePixelRatio = 1.0;
          addTearDown(() {
            tester.view.resetPhysicalSize();
            tester.view.resetDevicePixelRatio();
          });

          await tester.pumpWidget(
            ChangeNotifierProvider<AuthProvider>.value(
              value: _AuthPrueba(),
              child: MaterialApp(
                theme: AppTheme.light,
                home: entrada.value,
              ),
            ),
          );

          for (var i = 0; i < 25; i++) {
            await tester.pump(const Duration(milliseconds: 80));
          }

          final excepcion = tester.takeException()?.toString();
          if (excepcion != null &&
              !excepcion.contains('MissingPluginException') &&
              !excepcion.contains('SocketException')) {
            problemas.add(
              '${entrada.key} ${tamano.width.toInt()}x${tamano.height.toInt()}: $excepcion',
            );
          }
        }
      }

      expect(problemas, isEmpty, reason: problemas.join(' | '));
    },
  );
}
