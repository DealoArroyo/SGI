import { Router } from "express";
import { login } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);

router.get("/perfil", authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ mensaje: "Sesión cerrada" });
});

export default router;
