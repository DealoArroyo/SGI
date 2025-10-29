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