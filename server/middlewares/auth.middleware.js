import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: "No autenticado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        req.id_inquilino = decoded.id_inquilino;
        req.rol = decoded.rol;

        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
};
