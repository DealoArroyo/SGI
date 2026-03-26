import pool from "../db.js";

export const obtenerAreas = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;
        const result = await pool.query(`
            SELECT
                id,
                nombre,
                descripcion
            FROM areas 
            WHERE id_inquilino = $1
        `, [id_inquilino]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearArea = async (req, res) => {
    try {
        const { nombre, descripcion, color } = req.body;

        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const nuevaArea = await pool.query(`
            INSERT INTO areas (nombre, descripcion, id_inquilino, color)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    areas.id,
                    areas.nombre,
                    areas.descripcion,
                    areas.id_inquilino,
                    areas.color;
            `,
            [nombre, descripcion, id_inquilino, color]
        );

        res.status(201).json({
            mensaje: "Área creada de forma correcta",
            area: nuevaArea.rows[0],
        });
    } catch (error) {
        console.error("Error en crear área", error);
        return res.status(500).json({ error: error.message });
    }
};

export const obtenerAreasDeInquilino = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;

        const result = await pool.query(`
            SELECT
                a.id, 
                a.nombre, 
                a.descripcion,
                a.color
            FROM areas a
            WHERE a.id_inquilino = $1
            ORDER BY a.id ASC;
        `, [id_inquilino]);

        res.json(result.rows);

    } catch (error) {
        console.error("Error al obtener áreas", error);
        res.status(500).json({ error: error.message });
    }
};

export const obtenerAreaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const id_inquilino = req.id_inquilino;

    const result = await pool.query(
      `
      SELECT id, nombre, descripcion, color
      FROM areas
      WHERE id = $1 AND id_inquilino = $2
      `,
      [id, id_inquilino]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Área no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener área:", error);
    res.status(500).json({ message: "Error al obtener área" });
  }
};



export const eliminarArea = async (req, res) => {
    try {
        const { id } = req.params;
        const id_inquilino = req.id_inquilino;

        // 1. Verificar que el usuario existe y pertenece a este inquilino
        const area = await pool.query(
            `SELECT 
                id,
                id_inquilino 
            FROM areas 
            WHERE id = $1
            `, [id]
        );

        if (area.rows.length === 0) {
            return res.status(404).json({ error: "Área no encontrada" });
        }

        if (area.rows[0].id_inquilino !== id_inquilino) {
            return res.status(403).json({ error: "No tienes permisos para eliminar esta área" });
        }

        await pool.query(
            `DELETE FROM areas WHERE id = $1 AND id_inquilino = $2`,
            [id, id_inquilino]
        );

        return res.json({ mensaje: "Área eliminada correctamente" });

    } catch (error) {
        console.error("Error en eliminar área:", error);
        res.status(500).json({ error: error.message });
    }
};
