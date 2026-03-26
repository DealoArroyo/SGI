import pool from "../db.js";

export const bootstrapSecuritySchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios_seguridad (
      usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
      two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
      two_factor_secret TEXT,
      two_factor_temp_secret TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};
