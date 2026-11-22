import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:monitor_servicios_publicos/theme/app_theme.dart';
import 'package:monitor_servicios_publicos/widgets/common.dart';

void main() {
  test('la paleta Flutter coincide con los tokens de la web', () {
    expect(AppColors.primary.toARGB32(), 0xFF0F766E);
    expect(AppColors.primaryDark.toARGB32(), 0xFF115E59);
    expect(AppColors.amber.toARGB32(), 0xFFF59E0B);
    expect(AppColors.background.toARGB32(), 0xFFF8FAFC);
    expect(AppColors.surfaceAlt.toARGB32(), 0xFFF1F5F9);
    expect(AppColors.text.toARGB32(), 0xFF0F172A);
    expect(AppColors.muted.toARGB32(), 0xFF64748B);
    expect(AppColors.border.toARGB32(), 0xFFE2E8F0);
  });

  testWidgets('el estado vacío ofrece una acción accesible', (tester) async {
    var pulsado = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EstadoVacio(
            titulo: 'Sin reportes',
            descripcion: 'Cuando envíes un reporte aparecerá aquí.',
            etiquetaAccion: 'Crear reporte',
            onAccion: () => pulsado = true,
          ),
        ),
      ),
    );

    expect(find.text('Sin reportes'), findsOneWidget);
    await tester.tap(find.text('Crear reporte'));
    expect(pulsado, isTrue);
  });

  testWidgets('los esqueletos comunican el estado de carga', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: EsqueletoLista(mensaje: 'Cargando tus reportes...'),
        ),
      ),
    );

    expect(find.text('Cargando tus reportes...'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
