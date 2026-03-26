import pool from "../db.js";

export const obtenerProductos = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;
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
            WHERE p.id_inquilino = $1
        `, [id_inquilino]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearProducto = async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            nombre,
            detalles,
            precio_venta,
            costo_producto,
            vencimiento,
            id_unidad_medida,
            id_categoria,
            cantidad
        } = req.body;

        const id_inquilino = req.id_inquilino;

        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const nombreNormalizado = (nombre || "").trim();
        const detallesNormalizados = (detalles || "").trim();
        const cantidadNueva = Number(cantidad);
        const precioVentaNumero = Number(precio_venta);
        const costoProductoNumero = Number(costo_producto);

        if (
            !nombreNormalizado ||
            !Number.isFinite(cantidadNueva) ||
            cantidadNueva <= 0 ||
            !Number.isFinite(precioVentaNumero) ||
            !Number.isFinite(costoProductoNumero) ||
            !id_unidad_medida ||
            !id_categoria
        ) {
            return res.status(400).json({ error: "Datos de producto inválidos" });
        }

        await client.query("BEGIN");

        // Si el producto ya existe para este inquilino (mismo nombre + categoría + unidad),
        // se actualiza su cantidad y se conserva el SKU original.
        const productoExistente = await client.query(`
            SELECT
                id,
                sku,
                cantidad
            FROM productos
            WHERE id_inquilino = $1
            AND LOWER(TRIM(nombre)) = LOWER(TRIM($2))
            AND id_categoria = $3
            AND id_unidad_medida = $4
            LIMIT 1
            FOR UPDATE
        `, [id_inquilino, nombreNormalizado, id_categoria, id_unidad_medida]);

        if (productoExistente.rows.length > 0) {
            const existente = productoExistente.rows[0];

            const productoActualizado = await client.query(`
                UPDATE productos
                SET
                    cantidad = cantidad + $1,
                    detalles = $2,
                    precio_venta = $3,
                    costo_producto = $4,
                    vencimiento = $5
                WHERE id = $6
                RETURNING *
            `, [
                cantidadNueva,
                detallesNormalizados,
                precioVentaNumero,
                costoProductoNumero,
                vencimiento || null,
                existente.id
            ]);

            await client.query("COMMIT");

            return res.status(200).json({
                mensaje: `Producto existente actualizado. Se reutilizó SKU ${existente.sku} y se sumó inventario.`,
                producto: productoActualizado.rows[0],
            });
        }

        // 🔹 1. Obtener info de categoría + área
        const catInfo = await client.query(`
            SELECT c.nombre as categoria, a.nombre as area
            FROM categorias c
            JOIN areas a ON c.id_area = a.id
            WHERE c.id = $1
            AND c.id_inquilino = $2
        `, [id_categoria, id_inquilino]);

        if (catInfo.rows.length === 0) {
            throw new Error("Categoría no válida");
        }

        const { categoria, area } = catInfo.rows[0];

        const areaCode = area.substring(0,3).toUpperCase();
        const catCode = categoria.substring(0,3).toUpperCase();
        const prefix = `${areaCode}-${catCode}`;

        // 🔹 2. Buscar último SKU del tenant
        const lastSku = await client.query(`
            SELECT sku
            FROM productos
            WHERE id_inquilino = $1
            AND sku LIKE $2
            ORDER BY sku DESC
            LIMIT 1
            FOR UPDATE
        `, [id_inquilino, `${prefix}-%`]);

        let numero = 1;

        if (lastSku.rows.length > 0) {
            const ultimoNumero = parseInt(lastSku.rows[0].sku.split('-')[2]);
            numero = ultimoNumero + 1;
        }

        const numeroFormateado = String(numero).padStart(3, '0');
        const sku = `${prefix}-${numeroFormateado}`;

        // 🔹 3. Insertar producto con SKU
        const nuevoProducto = await client.query(`
            INSERT INTO productos
            (
                nombre,
                detalles,
                precio_venta,
                costo_producto,
                vencimiento,
                id_unidad_medida,
                id_categoria,
                id_inquilino,
                cantidad,
                sku
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *
        `,
        [
            nombre,
            detallesNormalizados,
            precioVentaNumero,
            costoProductoNumero,
            vencimiento || null,
            id_unidad_medida,
            id_categoria,
            id_inquilino,
            cantidadNueva,
            sku
        ]);

        await client.query("COMMIT");

        res.status(201).json({
            mensaje: "Producto creado de forma correcta",
            producto: nuevoProducto.rows[0],
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error al crear el producto", error);
        return res.status(500).json({ error: error.message });

    } finally {
        client.release();
    }
};

export const obtenerProductosDeInquilino = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;

        const result = await pool.query(`
            SELECT
                p.id,
                p.sku,
                p.nombre,
                p.detalles,
                p.precio_venta,
                p.costo_producto,
                p.vencimiento,
                c.nombre AS categoria,
                a.nombre AS area,
                p.cantidad,
                (p.cantidad * p.precio_venta) - (p.cantidad * p.costo_producto) AS ganancia,
                um.descripcion AS unidad_medida
            FROM productos p
            LEFT JOIN unidades_medida um ON p.id_unidad_medida = um.id
            LEFT JOIN categorias c ON p.id_categoria = c.id
            LEFT JOIN areas a ON c.id_area = a.id
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

export const obtenerProductoDeCategoria = async (req, res) => {
    try {
        const { id_categoria } = req.params;
        const id_inquilino = req.id_inquilino;

        const result = await pool.query(`
            SELECT 
                p.id,
                p.nombre,
                p.detalles,
                p.cantidad,
                um.descripcion AS unidad_medida
            FROM productos p
            LEFT JOIN unidades_medida um 
                ON p.id_unidad_medida = um.id
            WHERE p.id_categoria = $1
            AND p.id_inquilino = $2;
        `, [id_categoria, id_inquilino]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error al obtener categoría", error);
        res.status(500).json({ error: error.message })
    }
}

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
