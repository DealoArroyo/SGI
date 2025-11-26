import pool from "../db.js";

export const obtenerRoles = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM roles
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener roles" });
    }
};