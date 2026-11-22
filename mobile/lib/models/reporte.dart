class Reporte {
  final int idReporte;
  final String folio;
  final int idCategoria;
  final String categoriaNombre;
  final String categoriaColor;
  final String titulo;
  final String? descripcion;
  final double latitud;
  final double longitud;
  final String? direccionReferencia;
  final String estado;
  final String prioridad;
  final DateTime? fechaRegistro;
  final DateTime? fechaActualizacion;
  final DateTime? fechaCierre;
  final String? motivoRechazo;
  final List<String> fotos;
  final String? usuarioNombre;

  const Reporte({
    required this.idReporte,
    required this.folio,
    required this.idCategoria,
    required this.categoriaNombre,
    required this.categoriaColor,
    required this.titulo,
    this.descripcion,
    required this.latitud,
    required this.longitud,
    this.direccionReferencia,
    required this.estado,
    required this.prioridad,
    this.fechaRegistro,
    this.fechaActualizacion,
    this.fechaCierre,
    this.motivoRechazo,
    this.fotos = const [],
    this.usuarioNombre,
  });

  factory Reporte.fromJson(Map<String, dynamic> json) {
    final categoria = json['categoria'] is Map
        ? Map<String, dynamic>.from(json['categoria'] as Map)
        : <String, dynamic>{};

    final fotos = <String>[];
    final fotosJson = json['fotos'];
    if (fotosJson is List) {
      for (final foto in fotosJson) {
        if (foto is Map && foto['url'] != null) {
          fotos.add(foto['url'].toString());
        } else if (foto is String) {
          fotos.add(foto);
        }
      }
    }

    return Reporte(
      idReporte: _entero(json['id_reporte']),
      folio: (json['folio'] ?? '').toString(),
      idCategoria: _entero(json['id_categoria']),
      categoriaNombre: (categoria['nombre'] ?? 'Servicio público').toString(),
      categoriaColor: (categoria['color'] ?? '#0F766E').toString(),
      titulo: (json['titulo'] ?? 'Sin título').toString(),
      descripcion: json['descripcion']?.toString(),
      latitud: _numero(json['latitud']),
      longitud: _numero(json['longitud']),
      direccionReferencia: json['direccion_referencia']?.toString(),
      estado: (json['estado'] ?? 'PENDIENTE').toString(),
      prioridad: (json['prioridad'] ?? 'MEDIA').toString(),
      fechaRegistro: _fecha(json['fecha_registro']),
      fechaActualizacion: _fecha(json['fecha_actualizacion']),
      fechaCierre: _fecha(json['fecha_cierre']),
      motivoRechazo: json['motivo_rechazo']?.toString(),
      fotos: fotos,
      usuarioNombre: json['usuario'] is Map
          ? json['usuario']['nombre']?.toString()
          : json['usuario_nombre']?.toString(),
    );
  }

  String get estadoLabel => estadoLabels[estado] ?? estado;

  String get prioridadLabel => prioridadLabels[prioridad] ?? prioridad;

  bool get estaCerrado =>
      estado == 'COMPLETADO' || estado == 'RECHAZADO' || estado == 'ARCHIVADO';

  static const Map<String, String> estadoLabels = {
    'PENDIENTE': 'Pendiente',
    'EN_PROCESO': 'En proceso',
    'COMPLETADO': 'Completado',
    'RECHAZADO': 'Rechazado',
    'ARCHIVADO': 'Archivado',
  };

  static const Map<String, String> prioridadLabels = {
    'BAJA': 'Baja',
    'MEDIA': 'Media',
    'ALTA': 'Alta',
  };

  static int _entero(dynamic valor) =>
      valor is int ? valor : int.tryParse(valor?.toString() ?? '') ?? 0;

  static double _numero(dynamic valor) => valor is num
      ? valor.toDouble()
      : double.tryParse(valor?.toString() ?? '') ?? 0;

  static DateTime? _fecha(dynamic valor) {
    if (valor == null) return null;
    return DateTime.tryParse(valor.toString());
  }
}

class HistorialEvento {
  final int id;
  final String? estadoAnterior;
  final String estadoNuevo;
  final String? comentario;
  final DateTime? fechaCambio;
  final String? usuarioNombre;

  const HistorialEvento({
    required this.id,
    this.estadoAnterior,
    required this.estadoNuevo,
    this.comentario,
    this.fechaCambio,
    this.usuarioNombre,
  });

  factory HistorialEvento.fromJson(Map<String, dynamic> json) {
    return HistorialEvento(
      id: json['id_historial'] is int
          ? json['id_historial'] as int
          : int.tryParse(json['id_historial']?.toString() ?? '') ?? 0,
      estadoAnterior: json['estado_anterior']?.toString(),
      estadoNuevo: (json['estado_nuevo'] ?? '').toString(),
      comentario: json['comentario']?.toString(),
      fechaCambio: DateTime.tryParse(json['fecha_cambio']?.toString() ?? ''),
      usuarioNombre: json['usuario_nombre']?.toString(),
    );
  }

  String get estadoLabel => Reporte.estadoLabels[estadoNuevo] ?? estadoNuevo;
}
