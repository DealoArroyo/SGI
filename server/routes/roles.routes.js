import express from "express";
import { obtenerRoles } from "../controllers/roles.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { verificarInquilino } from "../middlewares/inquilino.middleware.js";

const router = express.Router();

router.get('/', authMiddleware, verificarInquilino, obtenerRoles);

export default router;
