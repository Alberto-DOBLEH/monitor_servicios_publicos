import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/reporte.dart';
import '../providers/auth_provider.dart';
import '../services/reporte_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/mapa_reportes.dart';

class ReporteDetalleScreen extends StatefulWidget {
  final int idReporte;

  const ReporteDetalleScreen({super.key, required this.idReporte});

  @override
  State<ReporteDetalleScreen> createState() => _ReporteDetalleScreenState();
}

class _ReporteDetalleScreenState extends State<ReporteDetalleScreen> {
  bool _cargando = true;
  String? _error;
  Reporte? _reporte;
  List<HistorialEvento> _historial = [];

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;

    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final datos = await ReporteRepository.detalle(widget.idReporte, token);
      setState(() {
        _reporte = datos['reporte'] as Reporte;
        _historial = datos['historial'] as List<HistorialEvento>;
      });
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _cargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final reporte = _reporte;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle del reporte'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _cargar),
        ],
      ),
      body: _cargando
          ? const Cargando(mensaje: 'Cargando detalle...')
          : _error != null
              ? AvisoError(mensaje: _error!, onReintentar: _cargar)
              : reporte == null
                  ? const AvisoError(mensaje: 'No se encontró el reporte')
                  : RefreshIndicator(
                      onRefresh: _cargar,
                      color: AppColors.primary,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
                        children: [
                          Row(
                            children: [
                              EstadoBadge(estado: reporte.estado),
                              const SizedBox(width: 8),
                              Text(
                                reporte.folio,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                  color: AppColors.muted,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            reporte.titulo,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.text,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.category_outlined,
                                  size: 15, color: AppColors.muted),
                              const SizedBox(width: 5),
                              Text(
                                reporte.categoriaNombre,
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Icon(Icons.flag_outlined,
                                  size: 15, color: AppColors.muted),
                              const SizedBox(width: 5),
                              Text(
                                'Prioridad ${reporte.prioridadLabel.toLowerCase()}',
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          if (reporte.descripcion != null) ...[
                            const SeccionTitulo(
                              titulo: 'Descripción',
                              icono: Icons.description_outlined,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              reporte.descripcion!,
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.text,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 22),
                          ],
                          const SeccionTitulo(
                            titulo: 'Ubicación',
                            icono: Icons.place_outlined,
                          ),
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: SizedBox(
                              height: 200,
                              child: MapaReportes(
                                reportes: [reporte],
                                seleccionado: reporte,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            reporte.direccionReferencia ??
                                'Sin referencia de dirección',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.muted,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${reporte.latitud.toStringAsFixed(6)}, '
                            '${reporte.longitud.toStringAsFixed(6)}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontFamily: 'monospace',
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 22),
                          if (reporte.motivoRechazo != null) ...[
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.report_gmailerrorred_outlined,
                                      color: AppColors.danger, size: 20),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Motivo del rechazo',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.danger,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          reporte.motivoRechazo!,
                                          style: const TextStyle(
                                            color: AppColors.danger,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 22),
                          ],
                          if (reporte.fotos.isNotEmpty) ...[
                            SeccionTitulo(
                              titulo: 'Evidencias (${reporte.fotos.length})',
                              icono: Icons.photo_library_outlined,
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              height: 110,
                              child: ListView.separated(
                                scrollDirection: Axis.horizontal,
                                itemCount: reporte.fotos.length,
                                separatorBuilder: (_, _) =>
                                    const SizedBox(width: 10),
                                itemBuilder: (context, indice) {
                                  final url = reporte.fotos[indice];
                                  return ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: CachedNetworkImage(
                                      imageUrl: url,
                                      width: 110,
                                      height: 110,
                                      fit: BoxFit.cover,
                                      placeholder: (_, _) => Container(
                                        color: AppColors.border,
                                        child: const Center(
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ),
                                      errorWidget: (_, _, _) => Container(
                                        color: AppColors.border,
                                        child: const Icon(Icons.broken_image),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(height: 22),
                          ],
                          const SeccionTitulo(
                            titulo: 'Seguimiento',
                            icono: Icons.timeline,
                          ),
                          const SizedBox(height: 14),
                          if (_historial.isEmpty)
                            const Text(
                              'Aún no hay movimientos.',
                              style: TextStyle(
                                color: AppColors.muted,
                                fontSize: 13,
                              ),
                            )
                          else
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children:
                                  _historial.reversed.map(_paso).toList(),
                            ),
                          const SizedBox(height: 20),
                          Text(
                            _textoRegistro(reporte),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
  }

  String _textoRegistro(Reporte reporte) {
    final fecha = reporte.fechaRegistro;
    if (fecha == null) return 'Registrado el —';
    return 'Registrado el ${DateFormat('dd MMM yyyy • HH:mm', 'es_MX').format(fecha)}';
  }

  Widget _paso(HistorialEvento evento) {
    final fecha = evento.fechaCambio != null
        ? DateFormat('dd MMM yyyy • HH:mm', 'es_MX').format(evento.fechaCambio!)
        : '';

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Container(width: 2, color: AppColors.border),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 0, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    evento.estadoLabel,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    fecha,
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  if (evento.comentario != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      evento.comentario!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.muted,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
