import pool from "../db.js";
import bcrypt from "bcrypt";

export const obtenerUsuarios = async (req, res) => {
    try{
        const result = await pool.query(`
            SELECT
                u.id AS usuario_id,
                u.nombre AS usuario_nombre,
                u.correo AS usuario_correo,
                r.nombre AS usuario_rol,
                i.nombre AS inquilino_nombre
            FROM usuarios u
            JOIN inquilinos i ON u.id_inquilino = i.id
            JOIN roles r ON u.id_rol = r.id
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const crearUsuario = async (req, res) => {
    try {
        const { nombre, correo, contrasena, id_rol } = req.body;

        const id_inquilino = req.id_inquilino; 
        if (!id_inquilino) {
            return res.status(400).json({ error: "Inquilino no detectado" });
        }

        const hashed = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = await pool.query(
            `INSERT INTO usuarios (nombre, correo, contrasena, id_inquilino, id_rol)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING 
                    usuarios.id, 
                    usuarios.nombre, 
                    usuarios.correo, 
                    usuarios.id_inquilino, 
                    usuarios.id_rol,
                    (SELECT nombre FROM roles WHERE roles.id = usuarios.id_rol) AS rol;
            `,
            [nombre, correo, hashed, id_inquilino, id_rol]
        );

        res.status(201).json({
            mensaje: "Usuario creado exitosamente",
            usuario: nuevoUsuario.rows[0],
        });

    } catch (error) {
        console.error("ERROR EN crearUsuario:", error);
        return res.status(500).json({ error: error.message });
    }
};


export const obtenerUsuariosDeInquilino = async (req, res) => {
    try {
        const id_inquilino = req.id_inquilino;

        const result = await pool.query(`
            SELECT u.id, u.nombre, u.correo, r.nombre AS rol
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id
            WHERE u.id_inquilino = $1
            ORDER BY u.id ASC;
        `, [id_inquilino]);

        res.json(result.rows);

    } catch (error) {
        console.error("Error en obtenerUsuariosDeInquilino:", error);
        res.status(500).json({ error: error.message });
    }
};

