import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";
import { obtenerCategorias, crearCategoria, obtenerCategoriasDeInquilino, eliminarCategoria } from "../controllers/categorias.controller.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

router.get(
    "/",
    authMiddleware,
    verificarInquilino,
    obtenerCategorias,
)

router.get(
    "/area/:id_area", 
    authMiddleware,
    verificarInquilino,
    obtenerCategoriasDeInquilino
);

router.post(
    "/",
    authMiddleware,
    verificarInquilino, 
    crearCategoria
);

router.delete(
    "/:id",
    authMiddleware,
    verificarInquilino,
    verificarRol(["Administrador"]),
    eliminarCategoria
);

export default router;