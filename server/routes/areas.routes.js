import { Router } from "express";
import { obtenerAreas, crearArea, obtenerAreasDeInquilino, obtenerAreaPorId, eliminarArea } from "../controllers/areas.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";

const router = Router();

router.get(
    "/areas", 
    authMiddleware,
    verificarInquilino,
    obtenerAreas
);  

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

router.get(
  "/:id",
  authMiddleware,
  verificarInquilino,
  obtenerAreaPorId
);

router.delete(
    "/:id",
    authMiddleware,
    verificarInquilino,
    verificarRol(["Administrador"]), 
    eliminarArea
);

export default router;