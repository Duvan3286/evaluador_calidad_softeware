// database/db.js
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// Configuración del cliente Turso / LibSQL
const db = createClient({
  url: process.env.TURSO_DB_URL || "libsql://calidad-software-duvan3286.aws-us-east-1.turso.io",
  authToken: process.env.TURSO_DB_TOKEN,
});

// Función para inicializar la BD y devolver el cliente
export async function openDb() {
  // Crear tabla si no existe
  await db.execute(`
    CREATE TABLE IF NOT EXISTS evaluaciones (
      id INTEGER PRIMARY KEY,
      app_name TEXT,
      descripcion TEXT,
      resultado TEXT,
      scores_json TEXT,
      pesos_json TEXT,
      comentario TEXT,
      fecha TEXT
    )
  `);

  return db;
}

/**
 * Función para guardar una evaluación
 * @param {Object} datos - Datos de la evaluación
 * {
 *   app_name: string,
 *   descripcion: string,
 *   resultado: number,
 *   scores_json: object,
 *   pesos_json: object,
 *   comentario: string,
 *   fecha: string | number
 * }
 */
export async function guardarEvaluacion(datos) {
  const dbClient = await openDb();

  const {
    app_name,
    descripcion,
    resultado,
    scores_json,
    pesos_json,
    comentario,
    fecha,
  } = datos;

  try {
    await dbClient.execute(
      `INSERT INTO evaluaciones
        (app_name, descripcion, resultado, scores_json, pesos_json, comentario, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        app_name,
        descripcion,
        resultado.toString(),        // convertir a string
        JSON.stringify(scores_json), // convertir a string
        JSON.stringify(pesos_json),  // convertir a string
        comentario,
        fecha.toString(),
      ]
    );
    return { ok: true };
  } catch (err) {
    console.error("❌ Error al guardar la evaluación:", err);
    throw new Error(err.message || "Error al guardar la evaluación");
  }
}

export default db;
