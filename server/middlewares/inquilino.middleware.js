export const verificarInquilino = (req, res, next) => {
    try {
        if (!req.user?.id_inquilino) {
            return res.status(403).json({
                error: "El usuario no está asociado a ningún inquilino"
            });
        }

        // Siempre tomamos el inquilino solo del token
        req.id_inquilino = req.user.id_inquilino;

        next();
    } catch (error) {
        res.status(500).json({ error: "Error verificando inquilino" });
    }
};
