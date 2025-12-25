import pool from "../db.js";

export const obtenerCategorias = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ca.id AS categoria_id,
                ca.nombre AS nombre,
                ca.descripcion,
                a.nombre AS area,
                i.nombre AS empresa
                FROM categorias ca
                JOIN areas a ON ca.id_area = a.id
                JOIN inquilinos i ON ca.id_inquilino = i.id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearCategoria = async (req, res) => {
    try{
        const { nombre, descripcion, id_area } = req.body;

        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no encontrado" });
        }

        const nuevaCategoria = await pool.query(`
            INSERT INTO categorias (nombre, descripcion, id_area, id_inquilino)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    categorias.id,
                    categorias.nombre,
                    categorias.descripcion,
                    categorias.id_area,
                    categorias.id_inquilino
        `, [nombre, descripcion, id_area, id_inquilino]
        );

        res.status(201).json({
            mensaje: "Categoría creada correctamente",
            categoria: nuevaCategoria.rows[0],
        });
    } catch (error) {
        console.error("Error al crear categoría:", error);
        return res.status(500).json({ error: error.message });
    }
};

export const obtenerCategoriasDeInquilino = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;

        const result = await pool.query(`
            SELECT
                c.id,
                c.nombre AS categoria,
                c.descripcion AS descripcion,
                a.nombre AS area,
                i.nombre AS empresa
            FROM categorias c
            JOIN areas a ON c.id_area = a.id
            JOIN inquilinos i ON c.id_inquilino = i.id
            WHERE c.id_inquilino = $1
            ORDER BY c.id ASC;
        `, [id_inquilino]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error en obtener categorías de inquilinos:", error);
        res.status(500).json({ error: error.message });
    }
};

export const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const id_inquilino = req.id_inquilino;
        
        const categoria = await pool.query(`
            SELECT
                id,
                id_inquilino
            FROM areas
            WHERE id = $1    
        `, [id]
        );

        if (categoria.rows.length === 0) {
            return res.status(404).json({ error: "Categoría no encontrada" })
        }

        await pool.query(`
            DELETE 
            FROM categorias 
            WHERE id = $1    
        `, [id]
        );

        return res.json({ mensaje: "Categoría eliminada de forma correcta" });

    } catch (error) {
        console.error("Error al eliminar categoría", error);
        res.status(500).json({ error: error.message });
    }
};