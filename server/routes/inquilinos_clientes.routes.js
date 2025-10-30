import { Router } from "express";
import {
    asociarClienteInquilino,
    obtenerRelaciones,
    eliminarRelacion,
} from "../controllers/inquilinos_clientes.controller.js";

const router = Router();

router.get('/', obtenerRelaciones);
router.post('/', asociarClienteInquilino);
router.delete('/', eliminarRelacion);

export default router;