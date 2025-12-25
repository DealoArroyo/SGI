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
            p.fecha_vencimiento AS producto_fecha_vencimiento,
            um.nombre AS unidad_medida,
            i.nombre AS inquilino_nombre
            FROM productos p
            JOIN unidades_medida um ON p.id_unidad_medida = um.id
            JOIN inquilinos i ON p.id_inquilino = i.id
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearProducto = async (req, res) => {
    try {
        const { nombre, detalles, precio_venta, costo_producto, vencimiento, fecha_vencimiento, id_unidad_medida } = req.body;

        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const nuevoProducto = await pool.query(`
            INSERT INTO productos (nombre, detalles, precio_venta, costo_producto, vencimiento, fecha_vencimiento, id_unidad_medida, id_inquilino)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING
                    productos.id,
                    productos.nombre,
                    productos.detalles,
                    productos.precio_venta,
                    productos.costo_producto,
                    productos.vencimiento,
                    productos.fecha_vencimiento,
                    productos.id_unidad_medida,
                    productos.id_inquilino;
        `,
        [nombre, detalles, precio_venta, costo_producto, vencimiento, fecha_vencimiento, id_unidad_medida, id_inquilino]
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
                p.fecha_vencimiento,
                p.id_unidad_medida
            FROM productos p
            WHERE p.id_inquilino = $1
            ORDER BY a.id ASC;
        `, [id_inquilino]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener productos", error);
        res.status(500).json({ error: error.messages });
    }
};

export const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const id_inquilino = req.id_inquilino;

        // Verificar que el usuario existe y pertenece a este inquilino
        const producto = await pool.query(`
            SELECT
                id,
                id_inquilino
            FROM productos
            WHERE id = $1    
        `, [id]
        );

        if (producto.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        await pool.query(`
            DELETE
            FROM productos
            WHERE id = $1    
        `, [id]
        );

        return res.json({ mensaje: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        res.status(500).json({ error: error.message });
    }
};