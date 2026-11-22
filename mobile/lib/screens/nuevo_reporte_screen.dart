import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart' as latlong;
import 'package:provider/provider.dart';

import '../config/app_config.dart';
import '../models/categoria.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/reporte_repository.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';
import '../widgets/mapa_reportes.dart';

class NuevoReporteScreen extends StatefulWidget {
  const NuevoReporteScreen({super.key});

  @override
  State<NuevoReporteScreen> createState() => _NuevoReporteScreenState();
}

class _NuevoReporteScreenState extends State<NuevoReporteScreen> {
  final _formulario = GlobalKey<FormState>();
  final _titulo = TextEditingController();
  final _descripcion = TextEditingController();
  final _direccion = TextEditingController();
  final ImagePicker _selector = ImagePicker();

  int _paso = 0;
  bool _cargandoCategorias = true;
  bool _obteniendoUbicacion = false;
  bool _enviando = false;
  String? _errorCategorias;
  String? _errorUbicacion;
  String? _errorEnvio;

  List<Categoria> _categorias = [];
  Categoria? _categoria;
  final List<XFile> _fotos = [];

  double _latitud = AppConfig.centroLat;
  double _longitud = AppConfig.centroLng;
  bool _ubicacionDetectada = false;

  static const int _maximoFotos = 3;
  static const int _maximoBytes = 5 * 1024 * 1024;

  @override
  void initState() {
    super.initState();
    _cargarCategorias();
    _obtenerUbicacion();
  }

  @override
  void dispose() {
    _titulo.dispose();
    _descripcion.dispose();
    _direccion.dispose();
    super.dispose();
  }

  Future<void> _cargarCategorias() async {
    try {
      final categorias = await ReporteRepository.categorias();
      setState(() {
        _categorias = categorias;
        _cargandoCategorias = false;
      });
    } catch (error) {
      setState(() {
        _errorCategorias = error.toString();
        _cargandoCategorias = false;
      });
    }
  }

  Future<void> _obtenerUbicacion() async {
    setState(() {
      _obteniendoUbicacion = true;
      _errorUbicacion = null;
    });

    try {
      final servicio = await Geolocator.isLocationServiceEnabled();
      if (!servicio) {
        throw 'Activa el GPS de tu dispositivo para capturar la ubicación.';
      }

      var permiso = await Geolocator.checkPermission();
      if (permiso == LocationPermission.denied) {
        permiso = await Geolocator.requestPermission();
      }

      if (permiso == LocationPermission.denied) {
        throw 'Necesitas permitir el acceso a tu ubicación para reportar.';
      }

      if (permiso == LocationPermission.deniedForever) {
        throw 'El permiso de ubicación está bloqueado. Habilítalo en Ajustes.';
      }

      final posicion = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );

      if (!AppConfig.dentroDeLosMochis(posicion.latitude, posicion.longitude)) {
        throw AppConfig.mensajeFueraDeArea();
      }

      setState(() {
        _latitud = posicion.latitude;
        _longitud = posicion.longitude;
        _ubicacionDetectada = true;
      });
    } catch (error) {
      setState(() => _errorUbicacion = error.toString());
    } finally {
      setState(() => _obteniendoUbicacion = false);
    }
  }

  Future<void> _tomarFoto() async {
    final foto = await _selector.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    if (foto != null) _agregarFotos([foto]);
  }

  Future<void> _elegirGaleria() async {
    final fotos = await _selector.pickMultiImage(imageQuality: 80);
    _agregarFotos(fotos);
  }

  void _agregarFotos(List<XFile> nuevas) {
    final disponibles = _maximoFotos - _fotos.length;
    if (disponibles <= 0) {
      _aviso('Máximo $_maximoFotos evidencias por reporte.');
      return;
    }

    final aceptadas = <XFile>[];
    final rechazadas = <String>[];

    for (final foto in nuevas.take(disponibles)) {
      final extension = foto.path.toLowerCase();
      final formatoValido =
          extension.endsWith('.jpg') ||
          extension.endsWith('.jpeg') ||
          extension.endsWith('.png') ||
          extension.endsWith('.webp');

      final tamano = File(foto.path).existsSync()
          ? File(foto.path).lengthSync()
          : 0;

      if (!formatoValido) {
        rechazadas.add('formato no permitido');
      } else if (tamano > _maximoBytes) {
        rechazadas.add('supera 5 MB');
      } else {
        aceptadas.add(foto);
      }
    }

    setState(() => _fotos.addAll(aceptadas));

    if (rechazadas.isNotEmpty) {
      _aviso(
        'Se omitieron ${rechazadas.length} imagen(es): ${rechazadas.join(", ")}.',
      );
    }
  }

  void _aviso(String mensaje) {
    mensajeError(context, mensaje);
  }

  bool _validarPaso() {
    if (_paso == 0) {
      if (_categoria == null) {
        _aviso('Selecciona el tipo de servicio público.');
        return false;
      }
      if (_titulo.text.trim().length < 5) {
        _aviso('Escribe un título de al menos 5 caracteres.');
        return false;
      }
    }

    if (_paso == 2) {
      if (!AppConfig.dentroDeLosMochis(_latitud, _longitud)) {
        _aviso(AppConfig.mensajeFueraDeArea());
        return false;
      }
    }

    return true;
  }

  void _siguiente() {
    if (!_validarPaso()) return;
    setState(() => _paso = (_paso + 1).clamp(0, 3));
  }

  void _anterior() => setState(() => _paso = (_paso - 1).clamp(0, 3));

  Future<void> _enviar() async {
    final token = context.read<AuthProvider>().token;
    if (token == null || _categoria == null) return;

    setState(() {
      _enviando = true;
      _errorEnvio = null;
    });

    try {
      await ReporteRepository.crear(
        token: token,
        categoriaId: _categoria!.id,
        titulo: _titulo.text.trim(),
        descripcion: _descripcion.text.trim(),
        direccion: _direccion.text.trim(),
        latitud: _latitud,
        longitud: _longitud,
        fotos: _fotos.map((foto) => foto.path).toList(),
      );

      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      setState(() => _errorEnvio = error.message);
    } catch (error) {
      setState(() => _errorEnvio = error.toString());
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final titulos = [
      '¿Qué quieres reportar?',
      'Cuéntanos más',
      'Ubicación y evidencias',
      'Revisa tu reporte',
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nuevo reporte'),
        leading: _paso == 0
            ? const BackButton()
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _anterior,
              ),
      ),
      body: Column(
        children: [
          _barraProgreso(),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                titulos[_paso],
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w800,
                  color: AppColors.text,
                ),
              ),
            ),
          ),
          Expanded(
            child: Form(
              key: _formulario,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: SingleChildScrollView(
                  key: ValueKey<int>(_paso),
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 30),
                  child: [
                    _pasoServicio(),
                    _pasoDetalles(),
                    _pasoUbicacion(),
                    _pasoRevision(),
                  ][_paso],
                ),
              ),
            ),
          ),
          _barraAcciones(),
        ],
      ),
    );
  }

  Widget _barraProgreso() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
      child: Row(
        children: List.generate(4, (indice) {
          final activo = indice <= _paso;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: indice == 3 ? 0 : 6),
              height: 5,
              decoration: BoxDecoration(
                color: activo ? AppColors.primary : AppColors.border,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _pasoServicio() {
    if (_cargandoCategorias) {
      return const Cargando(mensaje: 'Cargando servicios públicos...');
    }

    if (_errorCategorias != null) {
      return AvisoError(
        mensaje: _errorCategorias!,
        onReintentar: _cargarCategorias,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Selecciona el servicio afectado',
          style: TextStyle(color: AppColors.muted, fontSize: 13),
        ),
        const SizedBox(height: 14),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.35,
          ),
          itemCount: _categorias.length,
          itemBuilder: (context, indice) {
            final categoria = _categorias[indice];
            final seleccionada = _categoria?.id == categoria.id;
            final color = _colorHex(categoria.color);

            return InkWell(
              onTap: () => setState(() => _categoria = categoria),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: seleccionada ? color : AppColors.border,
                    width: seleccionada ? 2 : 1,
                  ),
                  boxShadow: seleccionada
                      ? [
                          BoxShadow(
                            color: color.withValues(alpha: 0.18),
                            blurRadius: 12,
                          ),
                        ]
                      : null,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        _icono(categoria.icono),
                        color: color,
                        size: 20,
                      ),
                    ),
                    Text(
                      categoria.nombre,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 22),
        TextFormField(
          controller: _titulo,
          maxLength: 120,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            labelText: 'Título del reporte',
            hintText: 'Ej. Poste sin luz frente a la escuela',
            prefixIcon: Icon(Icons.title_outlined),
          ),
          validator: (valor) => valor == null || valor.trim().length < 5
              ? 'Mínimo 5 caracteres'
              : null,
        ),
      ],
    );
  }

  Widget _pasoDetalles() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDFA),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFCCFBF1)),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline, color: AppColors.primary, size: 19),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Describe qué sucede y dónde lo notaste. Esto ayuda al municipio a atenderlo más rápido.',
                  style: TextStyle(color: AppColors.primaryDark, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        TextFormField(
          controller: _descripcion,
          maxLines: 5,
          maxLength: 2000,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            labelText: 'Descripción (opcional)',
            hintText: 'Detalles de la falla, desde cuándo ocurre, riesgos...',
            alignLabelWithHint: true,
          ),
          validator: (valor) => valor != null && valor.length > 2000
              ? 'Máximo 2000 caracteres'
              : null,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _direccion,
          maxLength: 255,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            labelText: 'Referencia de dirección (opcional)',
            hintText: 'Ej. Av. Leyva casi Calle Independencia',
            prefixIcon: Icon(Icons.signpost_outlined),
          ),
          validator: (valor) => valor != null && valor.length > 255
              ? 'Máximo 255 caracteres'
              : null,
        ),
      ],
    );
  }

  Widget _pasoUbicacion() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _ubicacionDetectada
                ? const Color(0xFFF0FDF4)
                : const Color(0xFFFFFBE6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _ubicacionDetectada
                  ? const Color(0xFFBBF7D0)
                  : const Color(0xFFFDE68A),
            ),
          ),
          child: Row(
            children: [
              Icon(
                _ubicacionDetectada ? Icons.gps_fixed : Icons.gps_off,
                color: _ubicacionDetectada
                    ? AppColors.success
                    : AppColors.amber,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _ubicacionDetectada
                          ? 'Ubicación capturada automáticamente'
                          : 'Ubicación estimada del mapa',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_latitud.toStringAsFixed(6)}, ${_longitud.toStringAsFixed(6)}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: _obteniendoUbicacion
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.my_location, color: AppColors.primary),
                onPressed: _obteniendoUbicacion ? null : _obtenerUbicacion,
                tooltip: 'Usar mi ubicación actual',
              ),
            ],
          ),
        ),
        if (_errorUbicacion != null) ...[
          const SizedBox(height: 10),
          Text(
            _errorUbicacion!,
            style: const TextStyle(color: AppColors.danger, fontSize: 12),
          ),
        ],
        const SizedBox(height: 14),
        Text(
          'Toca el mapa para ajustar el punto exacto si es necesario.',
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: SizedBox(
            height: 230,
            child: MapaReportes(
              ubicacionActual: latlong.LatLng(_latitud, _longitud),
              permitirSeleccionarPunto: true,
              onTapped: (punto) => setState(() {
                _latitud = punto.latitude;
                _longitud = punto.longitude;
                _ubicacionDetectada = false;
              }),
            ),
          ),
        ),
        const SizedBox(height: 22),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Evidencias fotográficas',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            Text(
              '${_fotos.length}/$_maximoFotos',
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (_fotos.isNotEmpty)
          SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _fotos.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, indice) {
                final foto = _fotos[indice];
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(
                        File(foto.path),
                        width: 92,
                        height: 92,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 2,
                      right: 2,
                      child: GestureDetector(
                        onTap: () => setState(() => _fotos.removeAt(indice)),
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        const SizedBox(height: 12),
        if (_fotos.length < _maximoFotos)
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _tomarFoto,
                  icon: const Icon(Icons.photo_camera_outlined, size: 18),
                  label: const Text('Cámara'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _elegirGaleria,
                  icon: const Icon(Icons.photo_library_outlined, size: 18),
                  label: const Text('Galería'),
                ),
              ),
            ],
          ),
        const SizedBox(height: 10),
        const Text(
          'JPEG, PNG o WebP · máximo 3 fotos de 5 MB cada una.',
          style: TextStyle(color: AppColors.muted, fontSize: 11),
        ),
      ],
    );
  }

  Widget _pasoRevision() {
    final fecha = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _icono(_categoria?.icono),
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _categoria?.nombre ?? 'Servicio público',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _dato('Título', _titulo.text.trim()),
                if (_descripcion.text.trim().isNotEmpty)
                  _dato('Descripción', _descripcion.text.trim()),
                if (_direccion.text.trim().isNotEmpty)
                  _dato('Dirección', _direccion.text.trim()),
                _dato(
                  'Coordenadas',
                  '${_latitud.toStringAsFixed(6)}, ${_longitud.toStringAsFixed(6)}',
                ),
                _dato('Evidencias', '${_fotos.length} foto(s)'),
                _dato(
                  'Fecha',
                  '${fecha.day}/${fecha.month}/${fecha.year} '
                      '${fecha.hour.toString().padLeft(2, '0')}:'
                      '${fecha.minute.toString().padLeft(2, '0')}',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDFA),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFCCFBF1)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.visibility_outlined,
                color: AppColors.primary,
                size: 18,
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Tu reporte quedará registrado como PENDIENTE. Podrás seguir su estado en “Mis reportes”.',
                  style: TextStyle(color: AppColors.primaryDark, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        if (_errorEnvio != null) ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _errorEnvio!,
              style: const TextStyle(color: AppColors.danger, fontSize: 12),
            ),
          ),
        ],
      ],
    );
  }

  Widget _dato(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            etiqueta.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.08,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            valor,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.text,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _barraAcciones() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 22),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          if (_paso > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _enviando ? null : _anterior,
                child: const Text('Atrás'),
              ),
            ),
          if (_paso > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _enviando
                  ? null
                  : _paso == 3
                  ? _enviar
                  : _siguiente,
              child: _enviando
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Text(_paso == 3 ? 'Enviar reporte' : 'Continuar'),
            ),
          ),
        ],
      ),
    );
  }

  static Color _colorHex(String? valor) {
    if (valor == null || valor.length != 7) return AppColors.primary;
    final hex = valor.replaceFirst('#', '');
    return Color(int.parse('FF$hex', radix: 16));
  }

  static IconData _icono(String? nombre) {
    switch (nombre) {
      case 'lightbulb':
        return Icons.lightbulb_outline;
      case 'construction':
        return Icons.construction_outlined;
      case 'water_damage':
        return Icons.water_damage_outlined;
      case 'water_drop':
        return Icons.water_drop_outlined;
      case 'delete':
        return Icons.delete_outline;
      case 'park':
        return Icons.park_outlined;
      case 'traffic':
        return Icons.traffic_outlined;
      case 'chair':
        return Icons.chair_outlined;
      default:
        return Icons.report_problem_outlined;
    }
  }
}
