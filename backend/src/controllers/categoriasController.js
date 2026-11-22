const pool = require("../config/db");

/** GET /api/categorias — catálogo activo para el wizard de Flutter. */
const listarCategorias = async (req, res) => {
  try {
    const [filas] = await pool.query(`
      SELECT id_categoria, nombre, descripcion, icono, color
      FROM Categoria_Servicio
      WHERE activo = TRUE
      ORDER BY id_categoria
    `);

    return res.json({ total: filas.length, categorias: filas });
  } catch (error) {
    console.error("[CATEGORIAS] Error listando categorías:", error);
    return res.status(500).json({ error: "No se pudieron obtener las categorías" });
  }
};

module.exports = { listarCategorias };
