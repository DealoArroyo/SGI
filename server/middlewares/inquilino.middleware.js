export const verificarInquilino = (req, res, next) => {
    try {
        const idInquilinoToken = req.user.id_inquilino;
        const idInquilinoBody = req.body.id_inquilino || req.params.id_inquilino;

        if (idInquilinoBody && Number(idInquilinoBody) !== Number(idInquilinoToken)) {
            return res.json({
                error: "No tienes permiso para acceder a otro inquilino"
            });
        }

        req.id_inquilino = idInquilinoToken;
        next();
    } catch (error) {
        res.status(500).json({ error: "Error verificando inquilino" });
    }
};