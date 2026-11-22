class Categoria {
  final int id;
  final String nombre;
  final String? descripcion;
  final String? icono;
  final String color;

  const Categoria({
    required this.id,
    required this.nombre,
    this.descripcion,
    this.icono,
    this.color = '#0F766E',
  });

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: json['id_categoria'] is int
          ? json['id_categoria'] as int
          : int.tryParse(json['id_categoria']?.toString() ?? '') ?? 0,
      nombre: (json['nombre'] ?? '').toString(),
      descripcion: json['descripcion']?.toString(),
      icono: json['icono']?.toString(),
      color: (json['color'] ?? '#0F766E').toString(),
    );
  }
}
