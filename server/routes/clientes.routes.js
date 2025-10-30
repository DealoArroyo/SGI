import { Router } from "express";
import { obtenerClientes, crearCliente } from "../controllers/clientes.controller.js";

const router = Router();

router.get('/', obtenerClientes);
router.post('/', crearCliente);

export default router;