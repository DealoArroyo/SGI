// src/services/authService.js
import api from "../api";

export const login = async (correo, contrasena) => {
  const res = await api.post("/auth/login", { correo, contrasena });
  return res.data;
};
