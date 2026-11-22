import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final auth = AuthProvider();
  await auth.inicializar();

  runApp(ChangeNotifierProvider.value(value: auth, child: const MiApp()));
}

class MiApp extends StatelessWidget {
  const MiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Monitoreo de Servicios Públicos',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const PuertaAutenticacion(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const HomeScreen(),
      },
    );
  }
}

class PuertaAutenticacion extends StatelessWidget {
  const PuertaAutenticacion({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.inicializando) return const SplashScreen();
    if (auth.autenticado) return const HomeScreen();
    return const LoginScreen();
  }
}
