// database/db.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../data/calidad.db");

export async function openDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Crear tabla si no existe
  await db.exec(`
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
