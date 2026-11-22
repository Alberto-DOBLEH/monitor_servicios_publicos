import 'package:flutter/material.dart';

import '../models/reporte.dart';
import '../theme/app_theme.dart';

class Cargando extends StatelessWidget {
  final String mensaje;

  const Cargando({super.key, this.mensaje = 'Cargando...'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 16),
          Text(
            mensaje,
            style: const TextStyle(color: AppColors.muted, fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class AvisoError extends StatelessWidget {
  final String mensaje;
  final VoidCallback? onReintentar;

  const AvisoError({super.key, required this.mensaje, this.onReintentar});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.error_outline, color: AppColors.danger, size: 28),
            ),
            const SizedBox(height: 14),
            Text(
              mensaje,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.text, fontSize: 14),
            ),
            if (onReintentar != null) ...[
              const SizedBox(height: 18),
              OutlinedButton.icon(
                onPressed: onReintentar,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Reintentar'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class EstadoBadge extends StatelessWidget {
  final String estado;

  const EstadoBadge({super.key, required this.estado});

  @override
  Widget build(BuildContext context) {
    final color = _color(estado);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        Reporte.estadoLabels[estado] ?? estado,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  static Color _color(String estado) {
    switch (estado) {
      case 'PENDIENTE':
        return AppColors.amber;
      case 'EN_PROCESO':
        return AppColors.info;
      case 'COMPLETADO':
        return AppColors.success;
      case 'RECHAZADO':
        return AppColors.danger;
      default:
        return AppColors.muted;
    }
  }
}

class SeccionTitulo extends StatelessWidget {
  final String titulo;
  final IconData icono;
  final Color color;

  const SeccionTitulo({
    super.key,
    required this.titulo,
    required this.icono,
    this.color = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icono, color: color, size: 18),
        ),
        const SizedBox(width: 10),
        Text(
          titulo,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.text,
          ),
        ),
      ],
    );
  }
}
