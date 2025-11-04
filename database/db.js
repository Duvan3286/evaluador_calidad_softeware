import { createClient } from "@libsql/client";

// Si usas variables de entorno (.env)
const db = createClient({
  url: process.env.TURSO_DB_URL || "libsql://calidad-software-duvan3286.aws-us-east-1.turso.io",
  authToken: process.env.TURSO_DB_TOKEN,
});

// Función equivalente a tu openDb(), pero usando Turso
export async function openDb() {
  // Crear tabla si no existe (solo se ejecuta una vez)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS evaluaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT,
      descripcion TEXT,
      resultado REAL,
      scores_json TEXT,
      pesos_json TEXT,
      comentario TEXT,
      fecha TEXT
    )
  `);

  return db;
}

export default db;
