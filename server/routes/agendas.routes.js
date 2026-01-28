import { Router } from "express";
import { obtenerAgendasPorInquilino, crearAgenda, eliminarAgenda } from "../controllers/agendas.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

router.get(
    "/",
    authMiddleware,
    verificarInquilino, 
    obtenerAgendasPorInquilino
);

router.post(
    "/",
    authMiddleware,
    verificarInquilino, 
    crearAgenda
);

router.delete(
    "/:id",
    authMiddleware,
    verificarInquilino,
    eliminarAgenda
);

export default router;