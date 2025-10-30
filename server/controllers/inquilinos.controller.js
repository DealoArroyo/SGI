import pool from "../db.js";
import bcrypt from "bcrypt";

export const obtenerInquilinos = async (req, res) => {
    try{
        const result = await pool.query(`
            SELECT
                i.id AS inquilino_id,
                i.nombre AS inquilino_nombre,
                i.correo AS inquilino_correo,
                i.tiempo AS inquilino_tiempo
            FROM inquilinos i;
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearInquilino = async (req, res) => {
  try {
    const { nombre, correo } = req.body;
    const result = await pool.query(
      `INSERT INTO inquilinos (nombre, correo) 
       VALUES ($1, $2) RETURNING *`,
      [nombre, correo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
