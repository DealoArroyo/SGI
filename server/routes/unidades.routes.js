import { Router } from "express";
import { obtenerUnidadesMedida } from "../controllers/unidades.controller.js";

const router = Router();

router.get(
    "/", 
    obtenerUnidadesMedida,
);


export default router;