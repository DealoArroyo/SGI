import pool from "../db.js";

export const obtenerCategorias = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;
        const { id_area } = req.params.id_area;
        const result = await pool.query(`
            SELECT
                id,
                nombre,
                descripcion
            FROM categorias
            WHERE id_inquilino = $1 AND id_area = $2
        `, [id_inquilino, id_area]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearCategoria = async (req, res) => {
    try{
        const { nombre, descripcion, id_area, color } = req.body;

        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no encontrado" });
        }

        const nuevaCategoria = await pool.query(`
            INSERT INTO categorias (nombre, descripcion, id_area, id_inquilino, color)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    categorias.id,
                    categorias.nombre,
                    categorias.descripcion,
                    categorias.id_area,
                    categorias.id_inquilino,
                    categorias.color;
        `, [nombre, descripcion, id_area, id_inquilino, color]
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
        const { id_area } = req.params;

        const result = await pool.query(`
            SELECT
                c.id,
                c.nombre,
                c.descripcion,
                c.color
            FROM categorias c
            WHERE c.id_inquilino = $1 AND c.id_area = $2
            ORDER BY c.id ASC;
        `, [id_inquilino, id_area]);
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
            FROM categorias
            WHERE id = $1 AND id_inquilino = $2    
        `, [id, id_inquilino]
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