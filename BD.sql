-- ============================================================================
-- Monitoreo de Servicios Públicos — Los Mochis, Sinaloa
-- Fase 1: esquema, usuarios, roles y datos de prueba
-- ============================================================================

DROP DATABASE IF EXISTS monitor_servicios_publicos;
CREATE DATABASE monitor_servicios_publicos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE monitor_servicios_publicos;

-- ----------------------------------------------------------------------------
-- 1. Usuarios y roles
-- ----------------------------------------------------------------------------
CREATE TABLE Usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NULL,
  rol ENUM('ADMIN', 'CIUDADANO') NOT NULL DEFAULT 'CIUDADANO',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME NULL
);

CREATE INDEX idx_usuario_rol ON Usuario(rol);
CREATE INDEX idx_usuario_activo ON Usuario(activo);

-- ----------------------------------------------------------------------------
-- 2. Categorías de servicios públicos
-- ----------------------------------------------------------------------------
CREATE TABLE Categoria_Servicio (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(255) NULL,
  icono VARCHAR(50) NULL,
  color VARCHAR(20) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_categoria_activo ON Categoria_Servicio(activo);

-- ----------------------------------------------------------------------------
-- 3. Reportes
-- ----------------------------------------------------------------------------
CREATE TABLE Reporte (
  id_reporte INT AUTO_INCREMENT PRIMARY KEY,
  folio VARCHAR(20) NOT NULL UNIQUE,
  id_usuario INT NOT NULL,
  id_categoria INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  direccion_referencia VARCHAR(255) NULL,
  estado ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ARCHIVADO')
    NOT NULL DEFAULT 'PENDIENTE',
  prioridad ENUM('BAJA', 'MEDIA', 'ALTA') NOT NULL DEFAULT 'MEDIA',
  id_admin_asignado INT NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  fecha_cierre DATETIME NULL,
  motivo_rechazo TEXT NULL,
  CONSTRAINT fk_reporte_usuario
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reporte_categoria
    FOREIGN KEY (id_categoria) REFERENCES Categoria_Servicio(id_categoria)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reporte_admin
    FOREIGN KEY (id_admin_asignado) REFERENCES Usuario(id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_reporte_estado ON Reporte(estado);
CREATE INDEX idx_reporte_categoria ON Reporte(id_categoria);
CREATE INDEX idx_reporte_usuario ON Reporte(id_usuario);
CREATE INDEX idx_reporte_fecha ON Reporte(fecha_registro);
CREATE INDEX idx_reporte_estado_fecha ON Reporte(estado, fecha_registro);
CREATE INDEX idx_reporte_usuario_estado ON Reporte(id_usuario, estado);

-- ----------------------------------------------------------------------------
-- 4. Evidencias fotográficas
-- ----------------------------------------------------------------------------
CREATE TABLE Reporte_Evidencia (
  id_evidencia INT AUTO_INCREMENT PRIMARY KEY,
  id_reporte INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  public_id VARCHAR(255) NULL,
  fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evidencia_reporte
    FOREIGN KEY (id_reporte) REFERENCES Reporte(id_reporte)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_evidencia_reporte ON Reporte_Evidencia(id_reporte);

-- ----------------------------------------------------------------------------
-- 5. Historial de estados
-- ----------------------------------------------------------------------------
CREATE TABLE Reporte_Historial (
  id_historial INT AUTO_INCREMENT PRIMARY KEY,
  id_reporte INT NOT NULL,
  estado_anterior VARCHAR(20) NULL,
  estado_nuevo VARCHAR(20) NOT NULL,
  comentario TEXT NULL,
  id_usuario INT NOT NULL,
  fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_reporte
    FOREIGN KEY (id_reporte) REFERENCES Reporte(id_reporte)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_historial_usuario
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_historial_reporte ON Reporte_Historial(id_reporte, fecha_cambio);

-- ============================================================================
-- DATOS DE PRUEBA
-- Contraseñas:
--   admin@servicios.test       -> Admin123!
--   ciudadano1@servicios.test  -> Ciudadano123!
--   ciudadano2@servicios.test  -> Ciudadano123!
-- ============================================================================

INSERT INTO Usuario (id_usuario, nombre, correo, contrasena, telefono, rol, activo) VALUES
(1, 'Administrador Municipal', 'admin@servicios.test',
 '$2b$12$P5438Ud9plwf1kU3VrvZEOuprskICEVC5DLq7W1D17kixZ978RVX6',
 '6681234567', 'ADMIN', TRUE),
(2, 'Ana López', 'ciudadano1@servicios.test',
 '$2b$12$buGwiWppz98MeMt8h5825.Dm.NxEFVrm5p9b/ZzVLKWWCDf0pzzDS',
 '6682345678', 'CIUDADANO', TRUE),
(3, 'Carlos Pérez', 'ciudadano2@servicios.test',
 '$2b$12$buGwiWppz98MeMt8h5825.Dm.NxEFVrm5p9b/ZzVLKWWCDf0pzzDS',
 '6683456789', 'CIUDADANO', TRUE);

INSERT INTO Categoria_Servicio (id_categoria, nombre, descripcion, icono, color) VALUES
(1, 'Alumbrado público', 'Postes, luminarias y cableado', 'lightbulb', '#EAB308'),
(2, 'Baches y pavimento', 'Baches, banquetas y pavimento dañado', 'construction', '#F97316'),
(3, 'Alcantarillado y drenaje', 'Drenaje tapado, fugas de aguas negras', 'water_damage', '#0D9488'),
(4, 'Fuga de agua potable', 'Fugas en tuberías y medidores', 'water_drop', '#0EA5E9'),
(5, 'Basura y limpieza', 'Basura acumulada y falta de recolección', 'delete', '#16A34A'),
(6, 'Parques y jardines', 'Áreas verdes, juegos y mobiliario de parque', 'park', '#22C55E'),
(7, 'Señalización y semáforos', 'Señales, semáforos y pintura vial', 'traffic', '#8B5CF6'),
(8, 'Mobiliario urbano', 'Bancas, paradas, contenedores y otros', 'chair', '#64748B'),
(9, 'Otros', 'Fallas que no encajan en otra categoría', 'report', '#94A3B8');

INSERT INTO Reporte
(id_reporte, folio, id_usuario, id_categoria, titulo, descripcion, latitud, longitud,
 direccion_referencia, estado, prioridad, id_admin_asignado,
 fecha_registro, fecha_actualizacion, fecha_cierre, motivo_rechazo) VALUES
(1, 'SP-2026-0001', 2, 1, 'Poste sin luz en Av. Leyva',
 'El poste frente a la escuela lleva tres noches sin encender. La zona queda muy oscura.',
 25.79200000, -108.99000000, 'Av. Leyva casi con Calle Independencia',
 'PENDIENTE', 'ALTA', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL),
(2, 'SP-2026-0002', 3, 2, 'Bache profundo en Calle Hidalgo',
 'Hay un bache grande que ya dañó la suspensión de un vecino.',
 25.78850000, -108.98200000, 'Calle Hidalgo entre Juárez y Allende',
 'PENDIENTE', 'MEDIA', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL),
(3, 'SP-2026-0003', 2, 3, 'Drenaje tapado en el Centro',
 'El drenaje está tapado y sale agua con mal olor sobre la banqueta.',
 25.79500000, -108.97800000, 'Calle Zaragoza, Col. Centro',
 'PENDIENTE', 'ALTA', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL),
(4, 'SP-2026-0004', 3, 5, 'Basura acumulada junto al parque',
 'No han pasado a recolectar la basura en cuatro días y ya hay bolsas en la calle.',
 25.78500000, -108.99500000, 'Parque de la Col. Bienestar',
 'PENDIENTE', 'BAJA', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL),
(5, 'SP-2026-0005', 2, 7, 'Semáforo descompuesto',
 'El semáforo de la intersección está en rojo intermitente desde ayer.',
 25.80000000, -108.97000000, 'Blvd. Rosales y Calle Cuauhtémoc',
 'PENDIENTE', 'ALTA', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL),
(6, 'SP-2026-0006', 3, 1, 'Luminaria intermitente',
 'La luminaria prende y apaga toda la noche; ya se revisó y sigue igual.',
 25.78000000, -109.00000000, 'Av. Jiquilpan, Col. Scally',
 'EN_PROCESO', 'MEDIA', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL),
(7, 'SP-2026-0007', 2, 2, 'Baches en Av. Obregón',
 'Hay varios baches seguidos en el carril de sur a norte.',
 25.80500000, -108.98800000, 'Av. Obregón entre Calle 5 y Calle 7',
 'EN_PROCESO', 'ALTA', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL),
(8, 'SP-2026-0008', 3, 4, 'Fuga de agua en la calle',
 'Sale agua de una tubería junto a la banqueta y ya se formó un charco.',
 25.77500000, -108.97500000, 'Calle Morelos, Col. Obrera',
 'EN_PROCESO', 'ALTA', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL),
(9, 'SP-2026-0009', 2, 6, 'Juegos dañados en el parque',
 'Los columpios están rotos y representan un riesgo para los niños.',
 25.79000000, -109.01000000, 'Parque de la Col. Las Palmas',
 'EN_PROCESO', 'BAJA', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL),
(10, 'SP-2026-0010', 3, 8, 'Banqueta rota frente a la primaria',
 'La banqueta tiene una losa levantada y los niños pueden tropezar.',
 25.81000000, -109.00000000, 'Calle Constitución, Col. Centro',
 'EN_PROCESO', 'MEDIA', 1, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, NULL),
(11, 'SP-2026-0011', 2, 1, 'Alumbrado reparado',
 'Se reportó el poste sin luz y el equipo municipal ya lo reparó.',
 25.77000000, -108.99000000, 'Av. Leyva, Col. Antonio Rosales',
 'COMPLETADO', 'MEDIA', 1, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
(12, 'SP-2026-0012', 3, 3, 'Alcantarillado limpio',
 'Se realizó la limpieza del drenaje y ya no hay agua estancada.',
 25.79500000, -108.96000000, 'Calle Galeana, Col. Centro',
 'COMPLETADO', 'ALTA', 1, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), NULL),
(13, 'SP-2026-0013', 2, 5, 'Recolección de basura normalizada',
 'El camión recolector ya pasó y la calle quedó limpia.',
 25.78200000, -108.97000000, 'Calle Degollado, Col. Bienestar',
 'COMPLETADO', 'BAJA', 1, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), NULL),
(14, 'SP-2026-0014', 3, 7, 'Señalización instalada',
 'Se colocó la señal de alto que faltaba en la esquina.',
 25.80200000, -109.01000000, 'Calle Ángel Flores y Calle 10',
 'COMPLETADO', 'MEDIA', 1, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), NULL),
(15, 'SP-2026-0015', 2, 9, 'Reporte duplicado',
 'Se envió dos veces la misma falla por error.',
 25.78900000, -108.95000000, 'Av. Leyva, Col. Centro',
 'RECHAZADO', 'BAJA', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL,
 'Duplicado del reporte SP-2026-0001.'),
(16, 'SP-2026-0016', 3, 9, 'Reporte sin ubicación verificable',
 'La ubicación no coincide con una dirección de la ciudad.',
 25.76500000, -109.00000000, 'Ubicación aproximada',
 'RECHAZADO', 'BAJA', 1, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), NULL,
 'La ubicación no corresponde a una falla verificable dentro de Los Mochis.');

INSERT INTO Reporte_Evidencia (id_reporte, url, public_id, fecha_subida) VALUES
(1, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0001', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0003', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0006', NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(8, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0008', NULL, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(11, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0011', NULL, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(12, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0012', NULL, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(14, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0014', NULL, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(15, 'https://placehold.co/800x600/0f766e/ffffff?text=Evidencia+SP-2026-0015', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Historial inicial de cada reporte
INSERT INTO Reporte_Historial (id_reporte, estado_anterior, estado_nuevo, comentario, id_usuario, fecha_cambio) VALUES
(1, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(6, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(8, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(9, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(10, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(11, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(12, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(13, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(14, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(15, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 2, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(16, NULL, 'PENDIENTE', 'Reporte creado por el ciudadano.', 3, DATE_SUB(NOW(), INTERVAL 9 DAY));

-- Historial de reportes en proceso
INSERT INTO Reporte_Historial (id_reporte, estado_anterior, estado_nuevo, comentario, id_usuario, fecha_cambio) VALUES
(6, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de alumbrado.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de obras públicas.', 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de agua potable.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de parques.', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(10, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de obras públicas.', 1, DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Historial de reportes completados
INSERT INTO Reporte_Historial (id_reporte, estado_anterior, estado_nuevo, comentario, id_usuario, fecha_cambio) VALUES
(11, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de alumbrado.', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(11, 'EN_PROCESO', 'COMPLETADO', 'Poste reparado y verificado en campo.', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado al equipo de drenaje.', 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(12, 'EN_PROCESO', 'COMPLETADO', 'Limpieza de drenaje realizada y verificada.', 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(13, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado a recolección.', 1, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(13, 'EN_PROCESO', 'COMPLETADO', 'Ruta de recolección normalizada.', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(14, 'PENDIENTE', 'EN_PROCESO', 'Reporte validado y asignado a señalización.', 1, DATE_SUB(NOW(), INTERVAL 12 DAY)),
(14, 'EN_PROCESO', 'COMPLETADO', 'Señal instalada y verificada.', 1, DATE_SUB(NOW(), INTERVAL 8 DAY));

-- Historial de reportes rechazados
INSERT INTO Reporte_Historial (id_reporte, estado_anterior, estado_nuevo, comentario, id_usuario, fecha_cambio) VALUES
(15, 'PENDIENTE', 'RECHAZADO', 'Duplicado del reporte SP-2026-0001.', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(16, 'PENDIENTE', 'RECHAZADO', 'La ubicación no corresponde a una falla verificable dentro de Los Mochis.', 1, DATE_SUB(NOW(), INTERVAL 8 DAY));
