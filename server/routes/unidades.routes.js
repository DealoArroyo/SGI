import { Router } from "express";
import { obtenerUnidadesMedida } from "../controllers/unidades.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

router.get(
    "/", 
    authMiddleware,
    verificarInquilino,
    obtenerUnidadesMedida,
);


export default router;
