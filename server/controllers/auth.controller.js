import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const result = await pool.query(`
            SELECT *
            FROM usuarios
            WHERE correo = $1
        `, [correo]);

        const usuario = result.rows[0];

        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        const validar = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!validar) return res.status(401).json({ error: "Contraseña incorrecta" });

        const token = jwt.sign(
            {
                id_usuario: usuario.id,
                id_inquilino: usuario.id_inquilino,
                rol: usuario.id_rol,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            mensaje: "Inicio de sesión exitoso",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                id_inquilino: usuario.id_inquilino,
                id_rol: usuario.id_rol,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};