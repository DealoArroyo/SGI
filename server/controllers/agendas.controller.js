import pool from "../db.js";

export const obtenerAgendasPorInquilino = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;
        const result = await pool.query(`
            SELECT
                *
            FROM agendas
            WHERE id_inquilino = $1
        `, [id_inquilino]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearAgenda = async (req, res) => {
    try {
        const { titulo, fecha } = req.body;
        const id_inquilino = req.id_inquilino;
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const nuevaAgenda = await pool.query(`
            INSERT INTO agendas (titulo, fecha, id_inquilino)
            VALUES ($1, $2, $3)
            RETURNING
                titulo,
                fecha,
                id_inquilino
        `, [titulo, fecha, id_inquilino]);
        res.status(201).json({
            mensaje: "Agenda creada correctamente",
            agenda: nuevaAgenda.rows[0]
        });
    } catch (error) {
        console.error("Error al crear agenda", error);
        return res.status(500).json({ error: error.message });
    }
};

export const eliminarAgenda = async (req, res) => {
    try {
        const { id } = req.params;
        const id_inquilino = req.id_inquilino;

        const agenda = await pool.query(`
            SELECT
            id,
            id_inquilino
            FROM agendas
            WHERE id = $1 AND id_inquilino = $2
        `, [id, id_inquilino]
        );

        if (agenda.rows.lenght === 0) {
            return res.status(404).json({ error: "Agenda no encontrada" })
        }

        await pool.query(`
            DELETE
            FROM agendas
            WHERE id = $1 AND id_inquilino = $2
        `, [id, id_inquilino]
        );

        return res.json({ mensaje: "Agenda eliminada correctamente" });

    } catch (error) {
        console.error("Error al eliminar la agenda", error);
        res.status(500).json({ error: error.message });
    }
}

export const actualizarAgenda = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, fecha } = req.body;
        const id_inquilino = req.id_inquilino;

        const agenda = await pool.query(`
            SELECT
            id,
            id_inquilino
            FROM agendas
            WHERE id = $1 AND id_inquilino = $2
        `, [id, id_inquilino]
        );

        if (agenda.rows.length === 0) {
            return res.status(404).json({ error: "Agenda no encontrada" });
        }

        const actualizada = await pool.query(`
            UPDATE agendas
            SET titulo = $1,
                fecha = $2
            WHERE id = $3 AND id_inquilino = $4
            RETURNING
                id,
                titulo,
                fecha
        `, [titulo, fecha, id, id_inquilino]
        );

        return res.json({
            mensaje: "Agenda actualizada correctamente",
            agenda: actualizada.rows[0]
        });
    } catch (error) {
        console.error("Error al actualizar la agenda", error);
        res.status(500).json({ error: error.message });
    }
}
