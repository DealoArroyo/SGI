import { Router } from "express";
import { obtenerInquilinos, crearInquilino } from "../controllers/inquilinos.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

router.get('/', authMiddleware, verificarInquilino, obtenerInquilinos);
router.post('/', crearInquilino);

export default router;
