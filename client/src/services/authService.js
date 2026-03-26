// src/services/authService.js
import api from "../api";

export const login = async ({ correo, contrasena, otp_code, two_factor_token }) => {
  const res = await api.post("/auth/login", {
    correo,
    contrasena,
    otp_code,
    two_factor_token,
  });
  return res.data;
};
