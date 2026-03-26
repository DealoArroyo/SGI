import { Router } from "express";
import {
    confirmarSetup2FA,
    desactivar2FA,
    estado2FA,
    iniciarSetup2FA,
    login
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { loginRateLimit } from "../middlewares/security.middleware.js";

const router = Router();

router.post("/login", loginRateLimit, login);

router.get("/perfil", authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

router.post("/logout", authMiddleware, (req, res) => {
    res.clearCookie("token");
    res.json({ mensaje: "Sesión cerrada" });
});

router.get("/2fa/status", authMiddleware, estado2FA);
router.post("/2fa/setup", authMiddleware, iniciarSetup2FA);
router.post("/2fa/enable", authMiddleware, confirmarSetup2FA);
router.post("/2fa/disable", authMiddleware, desactivar2FA);

export default router;
