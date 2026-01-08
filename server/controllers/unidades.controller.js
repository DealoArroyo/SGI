import pool from "../db.js";

export const obtenerUnidadesMedida = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *
      FROM unidades_medida
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
