import pool from "../db.js";

export const obtenerProductos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.id AS producto_id,
                p.nombre AS producto_nombre,
                p.detalles AS producto_detalles,
                p.precio_venta AS producto_precio_venta,
                p.costo_producto AS producto_costo_producto,
                p.vencimiento AS producto_vence,
                um.descripcion AS unidad_medida,
                c.nombre AS categoria
            FROM productos p
            JOIN unidades_medida um ON p.id_unidad_medida = um.id
            JOIN categorias c ON p.id_categoria = c.id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearProducto = async (req, res) => {
    try {
        const { nombre, detalles, precio_venta, costo_producto, vencimiento, id_unidad_medida, id_categoria } = req.body;

        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const nuevoProducto = await pool.query(`
            INSERT INTO productos (nombre, detalles, precio_venta, costo_producto, vencimiento, id_unidad_medida, id_categoria, id_inquilino)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING
                    productos.id,
                    productos.nombre,
                    productos.detalles,
                    productos.precio_venta,
                    productos.costo_producto,
                    productos.vencimiento,
                    productos.id_unidad_medida,
                    productos.id_categoria,
                    productos.id_inquilino;
        `,
        [nombre, detalles, precio_venta, costo_producto, vencimiento, id_unidad_medida, id_categoria, id_inquilino]
        );

        res.status(201).json({
            mensaje: "Producto creado de forma correcta",
            producto: nuevoProducto.rows[0],
        });
    } catch (error) {
        console.error("Error al crear el producto", error);
        return res.status(500).json({ error: error.message });
    }
};

export const obtenerProductosDeInquilino = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;

        const result = await pool.query(`
            SELECT
                p.id,
                p.nombre,
                p.detalles,
                p.precio_venta,
                p.costo_producto,
                p.vencimiento,
                c.nombre AS categoria,
                a.nombre AS area,
                um.descripcion AS unidad_medida
            FROM productos p
            LEFT JOIN unidades_medida um ON p.id_unidad_medida = um.id -- 👈 LEFT JOIN
            LEFT JOIN categorias c ON p.id_categoria = c.id           -- 👈 LEFT JOIN
            LEFT JOIN areas a ON c.id_area = a.id                     -- 👈 LEFT JOIN
            WHERE p.id_inquilino = $1
            ORDER BY p.id ASC;
        `, [id_inquilino]);

        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener productos", error);
        // Corrige también esto: era error.message, no error.messages
        res.status(500).json({ error: error.message }); 
    }
};

export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const id_inquilino = req.id_inquilino;
        
        const producto = await pool.query(`
            SELECT
                id,
                id_inquilino
            FROM productos
            WHERE id = $1 AND id_inquilino = $2    
        `, [id, id_inquilino]
        );

        if (producto.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrada" })
        }

        await pool.query(`
            DELETE 
            FROM productos 
            WHERE id = $1 AND id_inquilino = $2
        `, [id, id_inquilino]
        );

        return res.json({ mensaje: "Producto eliminado de forma correcta" });

    } catch (error) {
        console.error("Error al eliminar producto", error);
        res.status(500).json({ error: error.message });
    }
};