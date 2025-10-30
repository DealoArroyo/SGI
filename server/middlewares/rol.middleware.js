export const verificarRol = (rolesPermitidos = []) => {
    return (req, res, next) => {
        const { rol } = req.user;

        if (!rolesPermitidos.includes(rol)) {
            return res.status(403).json({
                error: "No tienes permisos para realizar esta acción"
            });
        }

        next();
    };
};