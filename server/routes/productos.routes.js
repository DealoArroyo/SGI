import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";
import { crearProducto, obtenerProductos } from "../controllers/productos.controller.js";

const router = Router();

router.get(
    "/", 
    obtenerProductos
);

router.post(
    "/",
    authMiddleware,
    verificarInquilino, 
    crearProducto
);

export default router;