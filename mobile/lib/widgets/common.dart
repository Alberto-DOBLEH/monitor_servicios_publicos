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
                color: AppColors.danger.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline,
                color: AppColors.danger,
                size: 28,
              ),
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
    final etiqueta = Reporte.estadoLabels[estado] ?? estado;

    return Semantics(
      label: 'Estado: $etiqueta',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          etiqueta,
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
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

/// Avisos breves y coherentes con la paleta de la web.
void mensajeExito(BuildContext context, String texto) {
  _mensaje(context, texto, AppColors.primaryDark);
}

void mensajeError(BuildContext context, String texto) {
  _mensaje(context, texto, AppColors.danger);
}

void _mensaje(BuildContext context, String texto, Color color) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;

  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      content: Text(texto),
      backgroundColor: color,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 4),
    ),
  );
}

/// Estado vacío reutilizable, con acción opcional.
class EstadoVacio extends StatelessWidget {
  final String titulo;
  final String descripcion;
  final IconData icono;
  final String? etiquetaAccion;
  final VoidCallback? onAccion;
  final bool compacto;

  const EstadoVacio({
    super.key,
    required this.titulo,
    required this.descripcion,
    this.icono = Icons.inbox_outlined,
    this.etiquetaAccion,
    this.onAccion,
    this.compacto = false,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$titulo. $descripcion',
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(compacto ? 16 : 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icono, size: compacto ? 34 : 56, color: AppColors.border),
              SizedBox(height: compacto ? 10 : 16),
              Text(
                titulo,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: compacto ? 14 : 17,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                descripcion,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.muted, fontSize: 13),
              ),
              if (onAccion != null) ...[
                const SizedBox(height: 18),
                OutlinedButton.icon(
                  onPressed: onAccion,
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(etiquetaAccion ?? 'Reintentar'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Esqueletos de carga: comunican progreso sin pantallas vacías.
class EsqueletoLista extends StatelessWidget {
  final String mensaje;

  const EsqueletoLista({super.key, this.mensaje = 'Cargando...'});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: mensaje,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
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
        ),
      ),
    );
  }
}

class EsqueletoDetalle extends StatelessWidget {
  final String mensaje;

  const EsqueletoDetalle({super.key, this.mensaje = 'Cargando detalle...'});

  @override
  Widget build(BuildContext context) => EsqueletoLista(mensaje: mensaje);
}

class EsqueletoMapa extends StatelessWidget {
  final String mensaje;

  const EsqueletoMapa({super.key, this.mensaje = 'Cargando mapa...'});

  @override
  Widget build(BuildContext context) => EsqueletoLista(mensaje: mensaje);
}
