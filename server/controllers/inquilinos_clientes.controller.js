import pool from "../db.js";

export const asociarClienteInquilino = async (req, res) => {
    try {
        const { id_cliente } = req.body;
        const { id_inquilino } = req.user;

        if (!id_cliente || !id_inquilino) {
            return res.status(400).json({ error: "Falta id_cliente o inquilino autenticado" });
        }

        await pool.query(
            `INSERT INTO inquilinos_clientes (id_cliente, id_inquilino)
            VALUES ($1, $2)`,
            [id_cliente, id_inquilino]
        );

        res.status(201).json({ mensaje: "Cliente asociado correctamente al inquilino" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const obtenerRelaciones = async (req, res) => {
    try {
        const { id_inquilino } = req.user;
        const result = await pool.query(`
            SELECT
                ic.id,
                i.nombre AS inquilino,
                c.nombre AS cliente
            FROM inquilinos_clientes ic
            JOIN inquilinos i ON ic.id_inquilino = i.id
            JOIN clientes c ON ic.id_cliente = c.id
            WHERE ic.id_inquilino = $1
            ORDER BY ic.id ASC;
        `, [id_inquilino]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const eliminarRelacion = async (req, res) => {
    try {
        const { id_cliente } = req.body;
        const { id_inquilino } = req.user;

        const result = await pool.query(
            `DELETE FROM inquilinos_clientes
            WHERE id_cliente = $1 AND id_inquilino = $2`,
            [id_cliente, id_inquilino]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ mensaje: "Relación no encontrada" });

        res.json({ mensaje: "Relación eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
