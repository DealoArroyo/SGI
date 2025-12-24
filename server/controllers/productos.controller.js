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
            
        `)
    }
}