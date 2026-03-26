import { Router } from "express";
import {
  obtenerPedidoPorId,
  crearPedido,
  confirmarPedido,
  entregarPedido,
  cancelarPedido,
  obtenerPedidos,
  obtenerResumenPedidos
} from "../controllers/pedidos.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

/* LISTAR PEDIDOS */
router.get(
  "/",
  authMiddleware,
  verificarInquilino,
  obtenerPedidos
);

router.get(
  "/resumen",
  authMiddleware,
  verificarInquilino,
  obtenerResumenPedidos
);

/* OBTENER PEDIDO POR ID */
router.get(
  "/:id",
  authMiddleware,
  verificarInquilino,
  obtenerPedidoPorId
);

router.post(
  "/",
  authMiddleware,
  verificarInquilino,
  crearPedido
);

router.post(
  "/:id/confirmar",
  authMiddleware,
  verificarInquilino,
  confirmarPedido
);

router.post(
  "/:id/entregar",
  authMiddleware,
  verificarInquilino,
  entregarPedido
);

router.delete(
  "/:id",
  authMiddleware,
  verificarInquilino,
  cancelarPedido
);

export default router;
