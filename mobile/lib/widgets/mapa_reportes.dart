import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../config/app_config.dart';
import '../models/reporte.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

class MapaReportes extends StatefulWidget {
  final List<Reporte> reportes;
  final Reporte? seleccionado;
  final void Function(Reporte)? onSeleccionar;
  final LatLng? ubicacionActual;
  final bool permitirSeleccionarPunto;
  final void Function(LatLng)? onTapped;

  const MapaReportes({
    super.key,
    this.reportes = const [],
    this.seleccionado,
    this.onSeleccionar,
    this.ubicacionActual,
    this.permitirSeleccionarPunto = false,
    this.onTapped,
  });

  @override
  State<MapaReportes> createState() => _MapaReportesState();
}

class _MapaReportesState extends State<MapaReportes> {
  final MapController _controlador = MapController();
  late final LatLngBounds _limites;

  @override
  void initState() {
    super.initState();
    _limites = LatLngBounds(
      LatLng(AppConfig.latMin, AppConfig.lngMin),
      LatLng(AppConfig.latMax, AppConfig.lngMax),
    );
  }

  @override
  void didUpdateWidget(MapaReportes oldWidget) {
    super.didUpdateWidget(oldWidget);

    final objetivo = widget.seleccionado;
    if (objetivo != null &&
        objetivo.idReporte != oldWidget.seleccionado?.idReporte) {
      _controlador.move(
        LatLng(objetivo.latitud, objetivo.longitud),
        AppConfig.zoomMaximo - 1,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        FlutterMap(
          mapController: _controlador,
          options: MapOptions(
            initialCenter: LatLng(AppConfig.centroLat, AppConfig.centroLng),
            initialZoom: AppConfig.zoomInicial,
            minZoom: AppConfig.zoomMinimo,
            maxZoom: AppConfig.zoomMaximo,
            cameraConstraint: CameraConstraint.containCenter(bounds: _limites),
            onTap: widget.permitirSeleccionarPunto
                ? (posicion, punto) {
                    if (AppConfig.dentroDeLosMochis(
                      punto.latitude,
                      punto.longitude,
                    )) {
                      widget.onTapped?.call(punto);
                    } else {
                      mensajeError(
                        context,
                        'Selecciona un punto dentro de Los Mochis',
                      );
                    }
                  }
                : null,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.monitoreo.servicios.app',
              maxZoom: AppConfig.zoomMaximo,
            ),
            if (widget.ubicacionActual != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: widget.ubicacionActual!,
                    width: 24,
                    height: 24,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.info.withValues(alpha: 0.25),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.info, width: 3),
                      ),
                    ),
                  ),
                ],
              ),
            MarkerLayer(
              markers: widget.reportes.map(_construirMarcador).toList(),
            ),
          ],
        ),

        // Etiqueta de cobertura
        Positioned(
          top: 12,
          left: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [
                BoxShadow(color: Color(0x1A0F172A), blurRadius: 12),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.location_city, size: 15, color: AppColors.primary),
                SizedBox(width: 6),
                Text(
                  'Los Mochis, Sinaloa',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Marker _construirMarcador(Reporte reporte) {
    final seleccionado = widget.seleccionado?.idReporte == reporte.idReporte;
    final color = _colorEstado(reporte.estado);

    return Marker(
      point: LatLng(reporte.latitud, reporte.longitud),
      width: 36,
      height: 36,
      child: GestureDetector(
        onTap: () => widget.onSeleccionar?.call(reporte),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(
              color: Colors.white,
              width: seleccionado ? 4 : 2.5,
            ),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: seleccionado ? 0.6 : 0.35),
                blurRadius: seleccionado ? 18 : 9,
              ),
            ],
          ),
          child: Icon(
            _iconoEstado(reporte.estado),
            color: Colors.white,
            size: seleccionado ? 19 : 16,
          ),
        ),
      ),
    );
  }

  static Color _colorEstado(String estado) {
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

  static IconData _iconoEstado(String estado) {
    switch (estado) {
      case 'PENDIENTE':
        return Icons.priority_high;
      case 'EN_PROCESO':
        return Icons.build_circle_outlined;
      case 'COMPLETADO':
        return Icons.check;
      case 'RECHAZADO':
        return Icons.close;
      default:
        return Icons.archive_outlined;
    }
  }
}
