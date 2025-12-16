import { Router } from "express";
import { crearArea, obtenerAreasDeInquilino } from "../controllers/areas.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

router.get(
    "/",
    authMiddleware,
    verificarInquilino, 
    obtenerAreasDeInquilino
);

router.post(
    "/",
    authMiddleware,
    verificarInquilino, 
    crearArea
);

export default router;