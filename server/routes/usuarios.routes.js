import { Router } from "express";
import { crearUsuario, obtenerUsuariosDeInquilino } from "../controllers/usuarios.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarRol } from "../middlewares/rol.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = Router();

router.get("/", authMiddleware, verificarInquilino, obtenerUsuariosDeInquilino);

router.post("/", authMiddleware, verificarInquilino, verificarRol([2]), crearUsuario);

export default router;