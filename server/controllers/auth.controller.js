import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const result = await pool.query(`
            SELECT 
                u.*,
                r.nombre AS nombre_rol,
                i.nombre AS nombre_inquilino
            FROM usuarios u
            JOIN roles r ON r.id = u.id_rol
            LEFT JOIN inquilinos i ON i.id = u.id_inquilino
            WHERE u.correo = $1
        `, [correo]);

        const usuario = result.rows[0];

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const validar = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!validar) return res.status(401).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign(
            {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                inquilino: usuario.nombre_inquilino,
                id_inquilino: usuario.id_inquilino,
                rol: usuario.nombre_rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            mensaje: "Inicio de sesión exitoso",
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                id_inquilino: usuario.id_inquilino,
                rol: usuario.nombre_rol,
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};