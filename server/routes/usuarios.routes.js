import { Router } from "express";
import {
    crearUsuario,
    eliminarUsuario,
    obtenerUsuariosDeInquilino
} from "../controllers/usuarios.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

// Crear usuario (solo rol 2 = administrador del inquilino)
router.post(
    "/",
    authMiddleware,
    verificarInquilino,
    verificarRol(["Administrador"]),
    crearUsuario
);

//Eliminar usuario (solo rol 2 = administrador del inquilino)
router.delete(
    "/:id", 
    authMiddleware,
    verificarInquilino,
    verificarRol(["Administrador"]),
    eliminarUsuario
);

// Obtener usuarios del inquilino actual
router.get(
    "/inquilino",
    authMiddleware,
    verificarInquilino,
    obtenerUsuariosDeInquilino
);

export default router;
