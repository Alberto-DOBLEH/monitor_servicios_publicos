import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/categoria.dart';
import '../models/reporte.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/reporte_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/mapa_reportes.dart';
import 'mis_reportes_screen.dart';
import 'nuevo_reporte_screen.dart';
import 'perfil_screen.dart';
import 'reporte_detalle_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _indice = 0;
  final GlobalKey<_MapaPublicoState> _mapaKey = GlobalKey<_MapaPublicoState>();

  Future<void> _nuevoReporte() async {
    final creado = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(builder: (_) => const NuevoReporteScreen()));

    if (creado == true && mounted) {
      setState(() => _indice = 1);
      _mapaKey.currentState?.recargar();
      mensajeExito(
        context,
        'Reporte enviado. Ahora aparece en “Mis reportes”.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Monitoreo de Servicios'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _indice,
        children: [
          MapaPublico(key: _mapaKey),
          const MisReportesScreen(),
          const PerfilScreen(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _nuevoReporte,
        backgroundColor: AppColors.amber,
        foregroundColor: const Color(0xFF422006),
        icon: const Icon(Icons.add_photo_alternate_outlined),
        label: const Text('Nuevo reporte'),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _indice,
        onTap: (indice) => setState(() => _indice = indice),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.map_outlined),
            activeIcon: Icon(Icons.map),
            label: 'Mapa',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'Mis reportes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Perfil',
          ),
        ],
      ),
    );
  }
}

class _MapaPublicoState extends State<MapaPublico> {
  bool _cargando = true;
  String? _error;
  List<Categoria> _categorias = [];
  List<Reporte> _reportes = [];
  int? _filtroCategoria;
  Reporte? _seleccionado;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = null;
    });

    try {
      final consulta = _filtroCategoria == null
          ? '?limite=200'
          : '?limite=200&categoria_id=$_filtroCategoria';

      final resultados = await Future.wait([
        ReporteRepository.categorias(),
        ApiService.get('/api/reportes$consulta').then((datos) {
          final lista = datos['reportes'] is List
              ? datos['reportes'] as List
              : [];
          return lista
              .whereType<Map>()
              .map((r) => Reporte.fromJson(Map<String, dynamic>.from(r)))
              .toList();
        }),
      ]);

      setState(() {
        _categorias = resultados[0] as List<Categoria>;
        _reportes = resultados[1] as List<Reporte>;
      });
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _cargando = false);
    }
  }

  void recargar() => _cargar();

  void _mostrarResumen(Reporte reporte) {
    setState(() => _seleccionado = reporte);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _HojaReporte(
        reporte: reporte,
        onVerDetalle: () {
          Navigator.of(context).pop();
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) =>
                  ReporteDetalleScreen(idReporte: reporte.idReporte),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (_cargando)
          const EsqueletoMapa(mensaje: 'Cargando mapa de reportes...')
        else if (_error != null)
          AvisoError(mensaje: _error!, onReintentar: _cargar)
        else
          Column(
            children: [
              _construirFiltros(),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.place, size: 16, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Text(
                      _reportes.isEmpty
                          ? 'Aún no hay reportes publicados en el mapa.'
                          : '${_reportes.length} reporte(s) en el mapa',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.muted,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.refresh, size: 19),
                      onPressed: _cargar,
                      tooltip: 'Actualizar',
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 84),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: MapaReportes(
                      reportes: _reportes,
                      seleccionado: _seleccionado,
                      onSeleccionar: _mostrarResumen,
                    ),
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _construirFiltros() {
    return SizedBox(
      height: 54,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        itemCount: _categorias.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, indice) {
          final todas = indice == 0;
          final categoria = todas ? null : _categorias[indice - 1];
          final activo = todas
              ? _filtroCategoria == null
              : _filtroCategoria == categoria!.id;

          return FilterChip(
            selected: activo,
            showCheckmark: false,
            label: Text(todas ? 'Todos' : categoria!.nombre),
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
            onSelected: (_) {
              setState(() => _filtroCategoria = todas ? null : categoria!.id);
              _cargar();
            },
          );
        },
      ),
    );
  }
}

class MapaPublico extends StatefulWidget {
  const MapaPublico({super.key});

  @override
  State<MapaPublico> createState() => _MapaPublicoState();
}

class _HojaReporte extends StatelessWidget {
  final Reporte reporte;
  final VoidCallback onVerDetalle;

  const _HojaReporte({required this.reporte, required this.onVerDetalle});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              EstadoBadge(estado: reporte.estado),
              const SizedBox(width: 8),
              Text(
                reporte.folio,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.muted,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            reporte.titulo,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            reporte.categoriaNombre,
            style: const TextStyle(color: AppColors.primary, fontSize: 13),
          ),
          if (reporte.descripcion != null) ...[
            const SizedBox(height: 12),
            Text(
              reporte.descripcion!,
              maxLines: 3,
              style: const TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onVerDetalle,
              icon: const Icon(Icons.visibility_outlined, size: 18),
              label: const Text('Ver detalle y seguimiento'),
            ),
          ),
        ],
      ),
    );
  }
}
