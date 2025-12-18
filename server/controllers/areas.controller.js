import pool from "../db.js";

export const obtenerAreas = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.id AS area_id,
                a.nombre AS area_nombre,
                a.descripcion AS area_descripcion,
                i.nombre AS inquilino_nombre
            FROM areas a
            JOIN inquilinos i ON a.id_inquilino = i.id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearArea = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const nuevaArea = await pool.query(`
            INSERT INTO areas (nombre, descripcion, id_inquilino)
                VALUES ($1, $2, $3)
                RETURNING
                    areas.id,
                    areas.nombre,
                    areas.descripcion,
                    areas.id_inquilino;
            `,
            [nombre, descripcion, id_inquilino]
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
                a.descripcion
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

export const eliminarArea = async (req, res) => {
    try {
        const { id } = req.params;          // ID del usuario a eliminar
        const id_inquilino = req.id_inquilino; // Inquilino desde el token

        // 1. Verificar que el usuario existe y pertenece a este inquilino
        const area = await pool.query(
            `SELECT id, id_inquilino FROM areas WHERE id = $1`,
            [id]
        );

        if (area.rows.length === 0) {
            return res.status(404).json({ error: "Área no encontrada" });
        }

        // 2. Eliminar de la base de datos
        await pool.query(
            `DELETE FROM areas WHERE id = $1`,
            [id]
        );

        return res.json({ mensaje: "Área eliminada correctamente" });

    } catch (error) {
        console.error("Error en eliminar área:", error);
        res.status(500).json({ error: error.message });
    }
};