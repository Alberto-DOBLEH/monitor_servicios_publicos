class Usuario {
  final int idUsuario;
  final String nombre;
  final String correo;
  final String? telefono;
  final String rol;
  final bool activo;
  final DateTime? fechaRegistro;

  const Usuario({
    required this.idUsuario,
    required this.nombre,
    required this.correo,
    this.telefono,
    required this.rol,
    required this.activo,
    this.fechaRegistro,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      idUsuario: _entero(json['id_usuario']),
      nombre: (json['nombre'] ?? '').toString(),
      correo: (json['correo'] ?? '').toString(),
      telefono: json['telefono']?.toString(),
      rol: (json['rol'] ?? '').toString(),
      activo: json['activo'] == true || json['activo'] == 1,
      fechaRegistro: _fecha(json['fecha_registro']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id_usuario': idUsuario,
    'nombre': nombre,
    'correo': correo,
    'telefono': telefono,
    'rol': rol,
    'activo': activo,
    'fecha_registro': fechaRegistro?.toIso8601String(),
  };

  bool get esCiudadano => rol == 'CIUDADANO';

  static int _entero(dynamic valor) =>
      valor is int ? valor : int.tryParse(valor?.toString() ?? '') ?? 0;

  static DateTime? _fecha(dynamic valor) {
    if (valor == null) return null;
    return DateTime.tryParse(valor.toString());
  }
}
