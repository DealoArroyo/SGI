import { Router } from "express";
import { obtenerClientesDeInquilino, crearCliente, eliminarClienteDeInquilino } from "../controllers/clientes.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";


const router = Router();

router.get(
    "/",
    authMiddleware,
    verificarInquilino, 
    obtenerClientesDeInquilino
);

router.post(
    "/", 
    authMiddleware,
    verificarInquilino,
    crearCliente
);

router.delete(
    "/:id",
    authMiddleware,
    verificarInquilino,
    eliminarClienteDeInquilino
);

export default router;