import pool from "../db.js";
import bcrypt from "bcrypt";

export const obtenerClientes = async (req, res) => {
    try{
        const result = await pool.query(`
            SELECT 
                c.id,
                c.nombre,
                c.correo,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', i.id,
                            'nombre', i.nombre
                        )
                    ) FILTER (WHERE i.id IS NOT NULL),
                     '[]'   
                ) AS inquilinos
            FROM clientes c
            LEFT JOIN inquilinos_clientes ic ON c.id = ic.id_cliente
            LEFT JOIN inquilinos i ON ic.id_inquilino = i.id
            GROUP BY c.id
            ORDER BY c.id;
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearCliente = async (req, res) => {
  try {
    const { nombre, correo, telefono } = req.body;
    const { id_inquilino } = req.user;

    if (!correo || !nombre || !telefono) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // 1. buscar cliente existente
    const clienteExistente = await pool.query(
      "SELECT id FROM clientes WHERE correo = $1",
      [correo]
    );

    let clienteId;

    if (clienteExistente.rows.length > 0) {
      clienteId = clienteExistente.rows[0].id;
    } else {

      const nuevoCliente = await pool.query(
        `INSERT INTO clientes (nombre, correo, telefono)
         VALUES ($1, $2, $3)
         RETURNING id, nombre, correo, telefono`,
        [nombre, correo, telefono]
      );

      clienteId = nuevoCliente.rows[0].id;
    }

    // 2. asociar cliente con el inquilino
    await pool.query(
      `INSERT INTO inquilinos_clientes (id_cliente, id_inquilino)
       VALUES ($1, $2)
       ON CONFLICT (id_cliente, id_inquilino) DO NOTHING`,
      [clienteId, id_inquilino]
    );

    return res.status(201).json({
      mensaje: "Cliente asociado correctamente",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error al crear o asociar cliente",
    });
  }
};


export const obtenerClientesDeInquilino = async (req, res) => {
    try {
        const { id_inquilino } = req.user;
        const result = await pool.query(`
            SELECT 
                c.id, 
                c.nombre, 
                c.correo,
                c.telefono
            FROM clientes c
            JOIN inquilinos_clientes ic ON c.id = ic.id_cliente
            WHERE ic.id_inquilino = $1
            ORDER BY c.id
        `, [id_inquilino]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const eliminarClienteDeInquilino = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_inquilino } = req.user;

        const result = await pool.query(
            `DELETE FROM inquilinos_clientes
             WHERE id_cliente = $1 AND id_inquilino = $2`,
             [id, id_inquilino]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Relación no encontrada" });
        }

        res.json({ mensaje: "Cliente removido del inquilino "});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};