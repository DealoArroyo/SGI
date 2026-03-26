import pool from "../db.js";

/* ============================
   OBTENER PEDIDOS (LISTA)
============================ */
export const obtenerPedidos = async (req, res) => {
  try {
    const { id_inquilino } = req.user;

    const result = await pool.query(`
      SELECT
        p.id,
        p.folio,
        p.cliente_id,
        c.nombre AS cliente,
        p.fecha,
        p.total,
        p.estado
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      WHERE p.id_inquilino = $1
      ORDER BY p.fecha DESC
    `, [id_inquilino]);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ============================
   RESUMEN DE PEDIDOS (DASHBOARD)
============================ */
export const obtenerResumenPedidos = async (req, res) => {
  try {
    const { id_inquilino } = req.user;

    const resumen = await pool.query(
      `
      WITH base AS (
        SELECT *
        FROM pedidos
        WHERE id_inquilino = $1
      ),
      mes_actual AS (
        SELECT *
        FROM base
        WHERE date_trunc('month', fecha) = date_trunc('month', now())
      ),
      mes_anterior AS (
        SELECT *
        FROM base
        WHERE date_trunc('month', fecha) = date_trunc('month', now() - interval '1 month')
      )
      SELECT
        (SELECT COUNT(*) FROM base) AS pedidos_totales,
        (SELECT COUNT(*) FROM base WHERE estado = 'borrador') AS pedidos_borrador,
        (SELECT COUNT(*) FROM base WHERE estado = 'confirmado') AS pedidos_confirmados,
        (SELECT COUNT(*) FROM base WHERE estado = 'entregado') AS pedidos_entregados,
        (SELECT COUNT(*) FROM base WHERE estado = 'cancelado') AS pedidos_cancelados,
        (
          SELECT COALESCE(SUM(total), 0)
          FROM mes_actual
          WHERE estado IN ('confirmado', 'entregado')
        ) AS ingresos_mes_actual,
        (
          SELECT COALESCE(SUM(total), 0)
          FROM mes_anterior
          WHERE estado IN ('confirmado', 'entregado')
        ) AS ingresos_mes_anterior,
        (
          SELECT COALESCE(AVG(total), 0)
          FROM mes_actual
          WHERE estado IN ('confirmado', 'entregado')
        ) AS ticket_promedio_mes,
        (
          SELECT COUNT(DISTINCT cliente_id)
          FROM mes_actual
          WHERE estado IN ('confirmado', 'entregado')
        ) AS clientes_activos_mes,
        (SELECT MAX(fecha) FROM base) AS ultima_fecha_pedido
      `,
      [id_inquilino]
    );

    const topProducto = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        SUM(pi.cantidad) AS cantidad_vendida
      FROM pedidos pe
      JOIN pedido_items pi ON pe.id = pi.pedido_id
      JOIN productos p ON p.id = pi.producto_id
      WHERE pe.id_inquilino = $1
      AND pe.estado IN ('confirmado', 'entregado')
      AND date_trunc('month', pe.fecha) = date_trunc('month', now())
      GROUP BY p.id, p.nombre
      ORDER BY cantidad_vendida DESC
      LIMIT 1
      `,
      [id_inquilino]
    );

    const topCliente = await pool.query(
      `
      SELECT
        c.id,
        c.nombre,
        SUM(pe.total) AS total_mes
      FROM pedidos pe
      JOIN clientes c ON c.id = pe.cliente_id
      WHERE pe.id_inquilino = $1
      AND pe.estado IN ('confirmado', 'entregado')
      AND date_trunc('month', pe.fecha) = date_trunc('month', now())
      GROUP BY c.id, c.nombre
      ORDER BY total_mes DESC
      LIMIT 1
      `,
      [id_inquilino]
    );

    const topProductos = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        SUM(pi.cantidad) AS cantidad_vendida,
        SUM(pi.subtotal) AS ventas_total
      FROM pedidos pe
      JOIN pedido_items pi ON pe.id = pi.pedido_id
      JOIN productos p ON p.id = pi.producto_id
      WHERE pe.id_inquilino = $1
      AND pe.estado IN ('confirmado', 'entregado')
      AND date_trunc('month', pe.fecha) = date_trunc('month', now())
      GROUP BY p.id, p.nombre
      ORDER BY ventas_total DESC
      LIMIT 5
      `,
      [id_inquilino]
    );

    const data = resumen.rows[0] || {};
    const ingresosMesActual = Number(data.ingresos_mes_actual || 0);
    const ingresosMesAnterior = Number(data.ingresos_mes_anterior || 0);

    let crecimientoVentasPct = 0;
    if (ingresosMesAnterior > 0) {
      crecimientoVentasPct =
        ((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) * 100;
    } else if (ingresosMesActual > 0) {
      crecimientoVentasPct = 100;
    }

    res.json({
      ...data,
      crecimiento_ventas_pct: crecimientoVentasPct,
      top_producto_mes: topProducto.rows[0] || null,
      top_cliente_mes: topCliente.rows[0] || null,
      top_productos_mes: topProductos.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener resumen de pedidos", error);
    res.status(500).json({ error: error.message });
  }
};


/* ============================
   OBTENER PEDIDO POR ID
============================ */
export const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_inquilino } = req.user;

    const pedido = await pool.query(`
      SELECT
        p.*,
        c.nombre AS cliente_nombre,
        uc.nombre AS usuario_creador_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN usuarios uc ON uc.id = p.usuario_creador
      WHERE p.id = $1 AND p.id_inquilino = $2
    `, [id, id_inquilino]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const items = await pool.query(`
      SELECT 
        pi.id,
        pi.producto_id,
        pr.nombre,
        pi.cantidad,
        pi.precio_unitario,
        pi.subtotal
      FROM pedido_items pi
      JOIN productos pr ON pi.producto_id = pr.id
      WHERE pi.pedido_id = $1
    `, [id]);

    const entrega = await pool.query(
      `
      SELECT
        peh.usuario_id AS usuario_entrega_id,
        u.nombre AS usuario_entrega_nombre,
        COALESCE(
          (to_jsonb(peh)->>'fecha')::timestamptz,
          (to_jsonb(peh)->>'created_at')::timestamptz,
          (to_jsonb(peh)->>'updated_at')::timestamptz
        ) AS fecha_entrega
      FROM pedido_estado_historial peh
      LEFT JOIN usuarios u ON u.id = peh.usuario_id
      WHERE peh.pedido_id = $1
      AND peh.estado = 'entregado'
      ORDER BY fecha_entrega DESC NULLS LAST
      LIMIT 1
      `,
      [id]
    );

    const entregaInfo = entrega.rows[0] || null;

    res.json({
      ...pedido.rows[0],
      fecha_creacion: pedido.rows[0].fecha,
      usuario_creador_id: pedido.rows[0].usuario_creador,
      usuario_creador_nombre: pedido.rows[0].usuario_creador_nombre,
      usuario_entrega_id: entregaInfo?.usuario_entrega_id || null,
      usuario_entrega_nombre: entregaInfo?.usuario_entrega_nombre || null,
      fecha_entrega: entregaInfo?.fecha_entrega || null,
      items: items.rows
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ============================
   CREAR PEDIDO (BORRADOR)
============================ */
export const crearPedido = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, items, notas } = req.body;
    const { id_inquilino, id: usuario_id } = req.user;

    if (!cliente_id || !items || items.length === 0) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await client.query("BEGIN");

    // Genera folio sin depender de una secuencia externa (pedidos_seq).
    // Se bloquea la tabla para evitar duplicados por concurrencia.
    await client.query("LOCK TABLE pedidos IN SHARE ROW EXCLUSIVE MODE");

    const year = new Date().getFullYear();
    const folioPrefix = `P-${year}-`;

    const ultimoFolio = await client.query(
      `
      SELECT folio
      FROM pedidos
      WHERE folio LIKE $1
      ORDER BY folio DESC
      LIMIT 1
      `,
      [`${folioPrefix}%`]
    );

    let siguienteNumero = 1;
    if (ultimoFolio.rows.length > 0) {
      const parts = String(ultimoFolio.rows[0].folio || "").split("-");
      const lastNumber = Number(parts[2]);
      if (Number.isFinite(lastNumber) && lastNumber > 0) {
        siguienteNumero = lastNumber + 1;
      }
    }

    const folio = `${folioPrefix}${String(siguienteNumero).padStart(4, "0")}`;

    const pedidoResult = await client.query(
      `
      INSERT INTO pedidos (
        folio,
        cliente_id,
        estado,
        notas,
        id_inquilino,
        usuario_creador
      )
      VALUES ($1, $2, 'borrador', $3, $4, $5)
      RETURNING id
      `,
      [folio, cliente_id, notas || null, id_inquilino, usuario_id]
    );

    const pedidoId = pedidoResult.rows[0].id;

    let subtotal = 0;

    for (const item of items) {
      const lineSubtotal = item.cantidad * item.precio_unitario;
      subtotal += lineSubtotal;

      await client.query(`
        INSERT INTO pedido_items (
          pedido_id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        pedidoId,
        item.producto_id,
        item.cantidad,
        item.precio_unitario,
        lineSubtotal
      ]);
    }

    const impuesto = subtotal * 0.16;
    const total = subtotal + impuesto;

    await client.query(`
      UPDATE pedidos
      SET subtotal = $1, impuesto = $2, total = $3
      WHERE id = $4
    `, [subtotal, impuesto, total, pedidoId]);

    await client.query(`
      INSERT INTO pedido_estado_historial (
        pedido_id, estado, usuario_id, comentario
      )
      VALUES ($1, 'borrador', $2, 'Pedido creado')
    `, [pedidoId, usuario_id]);

    await client.query("COMMIT");

    res.status(201).json({ mensaje: "Pedido creado", pedidoId });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

/* ============================
   CONFIRMAR PEDIDO (RESERVA)
============================ */
export const confirmarPedido = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { id: usuario_id, id_inquilino } = req.user;

    await client.query("BEGIN");

    const pedido = await client.query(`
      SELECT estado
      FROM pedidos
      WHERE id = $1 AND id_inquilino = $2
      FOR UPDATE
    `, [id, id_inquilino]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (pedido.rows[0].estado !== "borrador") {
      return res.status(400).json({ error: "El pedido no se puede confirmar" });
    }

    const items = await client.query(`
      SELECT producto_id, cantidad
      FROM pedido_items
      WHERE pedido_id = $1
    `, [id]);

    for (const item of items.rows) {
      const stock = await client.query(`
        SELECT cantidad
        FROM productos
        WHERE id = $1 AND id_inquilino = $2
        FOR UPDATE
      `, [item.producto_id, id_inquilino]);
      
      if (stock.rows.length === 0) {
        throw new Error(`Producto ${item.producto_id} no encontrado para este inquilino`);
      }

      const reservados = await client.query(`
        SELECT COALESCE(SUM(cantidad),0) AS reservado
        FROM reservas_stock rs
        JOIN pedidos p ON p.id = rs.pedido_id
        WHERE rs.producto_id = $1
        AND p.id_inquilino = $2
        AND p.estado IN ('confirmado', 'entregado')
      `, [item.producto_id, id_inquilino]);

      const disponible =
        Number(stock.rows[0].cantidad) - Number(reservados.rows[0].reservado);

      if (item.cantidad > disponible) {
        throw new Error(`Stock insuficiente para producto ${item.producto_id}`);
      }

      await client.query(`
        INSERT INTO reservas_stock (pedido_id, producto_id, cantidad)
        VALUES ($1, $2, $3)
      `, [id, item.producto_id, item.cantidad]);
    }

    await client.query(`
      UPDATE pedidos
      SET estado = 'confirmado'
      WHERE id = $1
    `, [id]);

    await client.query(`
      INSERT INTO pedido_estado_historial
      (pedido_id, estado, usuario_id, comentario)
      VALUES ($1, 'confirmado', $2, 'Pedido confirmado')
    `, [id, usuario_id]);

    await client.query("COMMIT");

    res.json({ mensaje: "Pedido confirmado" });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

/* ============================
   ENTREGAR PEDIDO
============================ */
export const entregarPedido = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { id: usuario_id, id_inquilino } = req.user;

    await client.query("BEGIN");

    const pedido = await client.query(
      `
      SELECT estado
      FROM pedidos
      WHERE id = $1 AND id_inquilino = $2
      FOR UPDATE
      `,
      [id, id_inquilino]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (pedido.rows[0].estado !== "confirmado") {
      return res
        .status(400)
        .json({ error: "Solo se pueden entregar pedidos confirmados" });
    }

    const items = await client.query(
      `
      SELECT producto_id, cantidad
      FROM pedido_items
      WHERE pedido_id = $1
      `,
      [id]
    );

    for (const item of items.rows) {
      const stock = await client.query(
        `
        SELECT cantidad
        FROM productos
        WHERE id = $1 AND id_inquilino = $2
        FOR UPDATE
        `,
        [item.producto_id, id_inquilino]
      );

      if (stock.rows.length === 0) {
        throw new Error(
          `Producto ${item.producto_id} no encontrado para este inquilino`
        );
      }

      const reservadoPedido = await client.query(
        `
        SELECT COALESCE(SUM(cantidad), 0) AS reservado
        FROM reservas_stock
        WHERE pedido_id = $1 AND producto_id = $2
        `,
        [id, item.producto_id]
      );

      const reservado = Number(reservadoPedido.rows[0].reservado);
      const cantidadItem = Number(item.cantidad);
      const existencia = Number(stock.rows[0].cantidad);

      if (reservado < cantidadItem) {
        throw new Error(
          `Reserva insuficiente para producto ${item.producto_id}`
        );
      }

      if (existencia < cantidadItem) {
        throw new Error(
          `Inventario insuficiente para entregar producto ${item.producto_id}`
        );
      }

      await client.query(
        `
        UPDATE productos
        SET cantidad = cantidad - $1
        WHERE id = $2 AND id_inquilino = $3
        `,
        [cantidadItem, item.producto_id, id_inquilino]
      );
    }

    await client.query(
      `
      DELETE FROM reservas_stock
      WHERE pedido_id = $1
      `,
      [id]
    );

    await client.query(
      `
      UPDATE pedidos
      SET estado = 'entregado'
      WHERE id = $1 AND id_inquilino = $2
      `,
      [id, id_inquilino]
    );

    await client.query(
      `
      INSERT INTO pedido_estado_historial
      (pedido_id, estado, usuario_id, comentario)
      VALUES ($1, 'entregado', $2, 'Pedido entregado')
      `,
      [id, usuario_id]
    );

    await client.query("COMMIT");

    res.json({ mensaje: "Pedido entregado" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

/* ============================
   CANCELAR PEDIDO
============================ */
export const cancelarPedido = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { id: usuario_id, id_inquilino } = req.user;

    await client.query("BEGIN");

    const pedido = await client.query(
      `
      SELECT id, estado
      FROM pedidos
      WHERE id = $1 AND id_inquilino = $2
      FOR UPDATE
      `,
      [id, id_inquilino]
    );

    if (pedido.rowCount === 0) {
      throw new Error("Pedido no encontrado");
    }

    await client.query(`
      DELETE FROM reservas_stock
      WHERE pedido_id = $1
    `, [id]);

    const result = await client.query(`
      UPDATE pedidos
      SET estado = 'cancelado'
      WHERE id = $1 AND id_inquilino = $2
    `, [id, id_inquilino]);

    if (result.rowCount === 0) {
      throw new Error("Pedido no encontrado");
    }

    await client.query(`
      INSERT INTO pedido_estado_historial
      (pedido_id, estado, usuario_id, comentario)
      VALUES ($1, 'cancelado', $2, 'Pedido cancelado')
    `, [id, usuario_id]);

    await client.query("COMMIT");

    res.json({ mensaje: "Pedido cancelado" });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
