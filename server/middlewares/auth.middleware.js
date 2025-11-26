import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            console.log("No hay token en cookies");
            return res.status(401).json({ error: "No autenticado" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("TOKEN DECODIFICADO:", decoded);

        req.user = decoded;
        req.id_inquilino = decoded.id_inquilino;
        req.rol = decoded.rol;

        console.log("ID_INQUILINO:", req.id_inquilino);
        console.log("ROL:", req.rol);

        next();
    } catch (error) {
        console.log("Error en middleware:", error.message);
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
};
