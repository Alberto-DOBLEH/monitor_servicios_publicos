import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/reporte.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/reporte_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import 'nuevo_reporte_screen.dart';
import 'reporte_detalle_screen.dart';

class MisReportesScreen extends StatefulWidget {
  const MisReportesScreen({super.key});

  @override
  State<MisReportesScreen> createState() => _MisReportesScreenState();
}

class _MisReportesScreenState extends State<MisReportesScreen> {
  bool _cargando = true;
  String? _error;
  List<Reporte> _reportes = [];
  String _filtro = 'TODOS';

  final List<Map<String, String>> _filtros = [
    {'valor': 'TODOS', 'label': 'Todos'},
    {'valor': 'PENDIENTE', 'label': 'Pendientes'},
    {'valor': 'EN_PROCESO', 'label': 'En proceso'},
    {'valor': 'COMPLETADO', 'label': 'Completados'},
    {'valor': 'RECHAZADO', 'label': 'Rechazados'},
  ];

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
      final reportes = await ReporteRepository.misReportes(token);
      setState(() => _reportes = reportes);
    } on ApiException catch (error) {
      if (error.statusCode == 401) {
        if (mounted) Navigator.of(context).pushReplacementNamed('/login');
        return;
      }
      setState(() => _error = error.message);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _cargando = false);
    }
  }

  List<Reporte> get _visibles => _filtro == 'TODOS'
      ? _reportes
      : _reportes.where((r) => r.estado == _filtro).toList();

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _cargar,
      color: AppColors.primary,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Mis reportes',
                    style: TextStyle(
                      fontSize: 23,
                      fontWeight: FontWeight.w800,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Solo puedes ver los reportes que tú enviaste.',
                    style: TextStyle(color: AppColors.muted, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _filtros.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, indice) {
                        final filtro = _filtros[indice];
                        final activo = filtro['valor'] == _filtro;
                        return ChoiceChip(
                          label: Text(filtro['label']!),
                          selected: activo,
                          showCheckmark: false,
                          selectedColor: AppColors.primary,
                          backgroundColor: Colors.white,
                          side: BorderSide(
                            color: activo ? AppColors.primary : AppColors.border,
                          ),
                          labelStyle: TextStyle(
                            color: activo ? Colors.white : AppColors.muted,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (_) =>
                              setState(() => _filtro = filtro['valor']!),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_cargando)
            const SliverFillRemaining(child: Cargando(mensaje: 'Cargando tus reportes...'))
          else if (_error != null)
            SliverFillRemaining(
              child: AvisoError(mensaje: _error!, onReintentar: _cargar),
            )
          else if (_visibles.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.inbox_outlined,
                        size: 64,
                        color: AppColors.border,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Sin reportes',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Cuando envíes un reporte aparecerá aquí con su seguimiento.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.muted, fontSize: 13),
                      ),
                      const SizedBox(height: 18),
                      OutlinedButton.icon(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const NuevoReporteScreen(),
                          ),
                        ),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Crear mi primer reporte'),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, indice) =>
                      _TarjetaReporte(reporte: _visibles[indice]),
                  childCount: _visibles.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _TarjetaReporte extends StatelessWidget {
  final Reporte reporte;

  const _TarjetaReporte({required this.reporte});

  @override
  Widget build(BuildContext context) {
    final fecha = reporte.fechaRegistro != null
        ? DateFormat('dd MMM yyyy', 'es_MX').format(reporte.fechaRegistro!)
        : '—';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ReporteDetalleScreen(idReporte: reporte.idReporte),
          ),
        ),
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.09),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.lightbulb_outline,
                        size: 19, color: AppColors.primary),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      reporte.categoriaNombre,
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  EstadoBadge(estado: reporte.estado),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                reporte.titulo,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.fingerprint, size: 14, color: AppColors.muted),
                  const SizedBox(width: 4),
                  Text(
                    reporte.folio,
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(width: 12),
                  const Icon(Icons.calendar_today_outlined,
                      size: 13, color: AppColors.muted),
                  const SizedBox(width: 4),
                  Text(
                    fecha,
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
              if (reporte.fotos.isNotEmpty) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.photo_camera_outlined,
                        size: 14, color: AppColors.muted),
                    const SizedBox(width: 4),
                    Text(
                      '${reporte.fotos.length} evidencia(s)',
                      style: const TextStyle(fontSize: 11, color: AppColors.muted),
                    ),
                    const Spacer(),
                    const Text(
                      'Ver seguimiento',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Icon(Icons.chevron_right,
                        size: 16, color: AppColors.primary),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
