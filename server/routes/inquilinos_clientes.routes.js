import { Router } from "express";
import {
    asociarClienteInquilino,
    obtenerRelaciones,
    eliminarRelacion,
} from "../controllers/inquilinos_clientes.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

router.get('/', authMiddleware, verificarInquilino, obtenerRelaciones);
router.post('/', authMiddleware, verificarInquilino, asociarClienteInquilino);
router.delete('/', authMiddleware, verificarInquilino, eliminarRelacion);

export default router;
