import 'package:flutter_test/flutter_test.dart';
import 'package:monitor_servicios_publicos/providers/auth_provider.dart';
import 'package:provider/provider.dart';

import 'package:monitor_servicios_publicos/main.dart';

void main() {
  testWidgets('Muestra la pantalla de carga al iniciar', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: AuthProvider(),
        child: const MiApp(),
      ),
    );

    expect(find.text('Monitoreo de Servicios Públicos'), findsOneWidget);
  });
}
