import express from "express";
import { obtenerRoles } from "../controllers/roles.controller.js";

const router = express.Router();

router.get('/', obtenerRoles);

export default router;