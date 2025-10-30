import pool from "../db.js";
import bcrypt from "bcrypt";

export const obtenerClientes = async (req, res) => {
    try{
        const result = await pool.query(`
            SELECT
                c.id AS cliente_id,
                c.nombre AS cliente_nombre,
                c.correo AS cliente_correo,
                i.id AS inquilino_id,
                i.nombre AS inquilino_nombre
            FROM clientes c
            LEFT JOIN inquilinos_clientes ic ON c.id = ic.id_cliente
            LEFT JOIN inquilinos i ON ic.id_inquilino = i.id
            ORDER BY c.id;
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearCliente = async (req, res) => {
    try {
        const { nombre, correo, contrasena, id_inquilino } = req.body;
        const hashed = await bcrypt.hash(contrasena, 10);

        const nuevoCliente = await pool.query(
            `INSERT INTO clientes (nombre, correo, contrasena) 
             VALUES ($1, $2, $3) RETURNING *`,
            [nombre, correo, hashed]
        );

        await pool.query(
            `INSERT INTO inquilinos_clientes (id_cliente, id_inquilino) 
             VALUES ($1, $2)`,
            [nuevoCliente.rows[0].id, id_inquilino]
        );

        res.status(201).json({
            mensaje: "Cliente creado y asociado correctamente",
            cliente: nuevoCliente.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const obtenerClientesDeInquilino = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT c.id, c.nombre, c.correo
            FROM clientes c
            JOIN inquilinos_clientes ic ON c.id = ic.id_cliente
            WHERE ic.id_inquilino = $1
        `, [id]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};