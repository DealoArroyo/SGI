import { Router } from "express";
import { obtenerInquilinos, crearInquilino } from "../controllers/inquilinos.controller.js";

const router = Router();

router.get('/', obtenerInquilinos);
router.post('/', crearInquilino);

export default router;