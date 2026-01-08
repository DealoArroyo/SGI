import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";
import { crearProducto, obtenerProductos, obtenerProductosDeInquilino, eliminarProducto } from "../controllers/productos.controller.js";

const router = Router();

router.get(
    "/", 
    obtenerProductos
);

router.get(
    "/inquilino",
    authMiddleware,
    verificarInquilino,
    obtenerProductosDeInquilino
);

router.post(
    "/",
    authMiddleware,
    verificarInquilino, 
    crearProducto
);

router.delete(
    "/:id",
    authMiddleware,
    verificarInquilino,
    eliminarProducto
);

export default router;