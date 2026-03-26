import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  buildOtpAuthUrl,
  generateBase32Secret,
  verifyTotpCode,
} from "../utils/totp.js";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
});

const buildSessionToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      inquilino: usuario.nombre_inquilino,
      id_inquilino: usuario.id_inquilino,
      rol: usuario.nombre_rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const buildTwoFactorChallenge = (usuario) => {
  return jwt.sign(
    {
      purpose: "2fa-login",
      user_id: usuario.id,
      correo: usuario.correo,
    },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );
};

export const login = async (req, res) => {
  try {
    const {
      correo,
      contrasena,
      otp_code,
      two_factor_token,
    } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    const result = await pool.query(
      `
      SELECT
        u.*,
        r.nombre AS nombre_rol,
        i.nombre AS nombre_inquilino
      FROM usuarios u
      JOIN roles r ON r.id = u.id_rol
      LEFT JOIN inquilinos i ON i.id = u.id_inquilino
      WHERE LOWER(TRIM(u.correo)) = LOWER(TRIM($1))
      LIMIT 1
      `,
      [correo]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    let validar = false;
    try {
      validar = await bcrypt.compare(contrasena, usuario.contrasena);
    } catch {
      validar = false;
    }

    // Compatibilidad con usuarios legacy donde la contraseña pudo guardarse sin hash.
    if (!validar && usuario.contrasena === contrasena) {
      validar = true;
      const nuevoHash = await bcrypt.hash(contrasena, 10);
      await pool.query(
        `
        UPDATE usuarios
        SET contrasena = $2
        WHERE id = $1
        `,
        [usuario.id, nuevoHash]
      );
    }

    if (!validar) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const seguridadRes = await pool.query(
      `
      SELECT two_factor_enabled, two_factor_secret
      FROM usuarios_seguridad
      WHERE usuario_id = $1
      LIMIT 1
      `,
      [usuario.id]
    );

    const seguridad = seguridadRes.rows[0];
    const twoFactorEnabled = Boolean(seguridad?.two_factor_enabled);

    if (twoFactorEnabled) {
      if (!otp_code || !two_factor_token) {
        return res.status(200).json({
          requires_2fa: true,
          two_factor_token: buildTwoFactorChallenge(usuario),
        });
      }

      let challengePayload;
      try {
        challengePayload = jwt.verify(two_factor_token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ error: "Código 2FA expirado o inválido" });
      }

      if (
        challengePayload?.purpose !== "2fa-login" ||
        Number(challengePayload?.user_id) !== Number(usuario.id)
      ) {
        return res.status(401).json({ error: "Desafío 2FA inválido" });
      }

      const validOtp = verifyTotpCode({
        secret: seguridad.two_factor_secret,
        code: otp_code,
      });

      if (!validOtp) {
        return res.status(401).json({ error: "Código 2FA incorrecto" });
      }
    }

    const token = buildSessionToken(usuario);

    res.cookie("token", token, getCookieOptions());

    res.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        id_inquilino: usuario.id_inquilino,
        rol: usuario.nombre_rol,
      },
      requires_2fa: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const estado2FA = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const result = await pool.query(
      `
      SELECT two_factor_enabled
      FROM usuarios_seguridad
      WHERE usuario_id = $1
      LIMIT 1
      `,
      [usuarioId]
    );

    res.json({
      enabled: Boolean(result.rows[0]?.two_factor_enabled),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const iniciarSetup2FA = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const accountName = req.user.correo;
    const issuer = process.env.TOTP_ISSUER || "SGI";

    const secret = generateBase32Secret(20);
    const otpauth_url = buildOtpAuthUrl({ issuer, accountName, secret });

    await pool.query(
      `
      INSERT INTO usuarios_seguridad (usuario_id, two_factor_enabled, two_factor_temp_secret, updated_at)
      VALUES ($1, false, $2, NOW())
      ON CONFLICT (usuario_id)
      DO UPDATE SET
        two_factor_temp_secret = EXCLUDED.two_factor_temp_secret,
        updated_at = NOW()
      `,
      [usuarioId, secret]
    );

    return res.json({
      secret,
      otpauth_url,
      issuer,
      account_name: accountName,
      message: "Escanea el secreto en tu app de autenticación y confirma con un código",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmarSetup2FA = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { otp_code } = req.body;

    if (!otp_code) {
      return res.status(400).json({ error: "Código OTP requerido" });
    }

    const security = await pool.query(
      `
      SELECT two_factor_temp_secret
      FROM usuarios_seguridad
      WHERE usuario_id = $1
      LIMIT 1
      `,
      [usuarioId]
    );

    const tempSecret = security.rows[0]?.two_factor_temp_secret;
    if (!tempSecret) {
      return res.status(400).json({ error: "No hay setup 2FA pendiente" });
    }

    const validOtp = verifyTotpCode({ secret: tempSecret, code: otp_code });
    if (!validOtp) {
      return res.status(401).json({ error: "Código OTP inválido" });
    }

    await pool.query(
      `
      UPDATE usuarios_seguridad
      SET
        two_factor_enabled = true,
        two_factor_secret = $2,
        two_factor_temp_secret = NULL,
        updated_at = NOW()
      WHERE usuario_id = $1
      `,
      [usuarioId, tempSecret]
    );

    return res.json({ message: "2FA activado correctamente", enabled: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const desactivar2FA = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { otp_code } = req.body;

    const security = await pool.query(
      `
      SELECT two_factor_enabled, two_factor_secret
      FROM usuarios_seguridad
      WHERE usuario_id = $1
      LIMIT 1
      `,
      [usuarioId]
    );

    const current = security.rows[0];
    if (!current?.two_factor_enabled || !current?.two_factor_secret) {
      return res.status(400).json({ error: "2FA no está activo" });
    }

    const validOtp = verifyTotpCode({ secret: current.two_factor_secret, code: otp_code });
    if (!validOtp) {
      return res.status(401).json({ error: "Código OTP inválido" });
    }

    await pool.query(
      `
      UPDATE usuarios_seguridad
      SET
        two_factor_enabled = false,
        two_factor_secret = NULL,
        two_factor_temp_secret = NULL,
        updated_at = NOW()
      WHERE usuario_id = $1
      `,
      [usuarioId]
    );

    return res.json({ message: "2FA desactivado", enabled: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
