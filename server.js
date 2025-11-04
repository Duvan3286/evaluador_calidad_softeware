import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { openDb } from "./database/db.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { performance } from "perf_hooks";
import * as cheerio from "cheerio";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// 🧹 Borrar todos los registros
app.delete("/api/evaluaciones", async (req, res) => {
  try {
    const db = await openDb();

    const result = await db.execute("SELECT COUNT(*) AS total FROM evaluaciones");
    const total = result.rows[0]?.total || 0;

    if (total === 0) {
      return res.status(200).json({ message: "⚠️ No hay registros para borrar." });
    }

    await db.execute("DELETE FROM evaluaciones");

    res.json({ message: "✅ Todos los registros fueron eliminados correctamente." });
  } catch (err) {
    console.error("Error al borrar todos los registros:", err);
    res.status(500).json({ error: "Error al borrar todos los registros." });
  }
});

// 🧾 Crear nueva evaluación
app.post("/api/evaluaciones", async (req, res) => {
  try {
    const { app_name, descripcion, resultado, scores_json, pesos_json, comentario } = req.body;
    const db = await openDb();
    const fecha = Date.now();

    await db.execute(
      `INSERT INTO evaluaciones (app_name, descripcion, resultado, scores_json, pesos_json, comentario, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [app_name, descripcion, resultado, scores_json, pesos_json, comentario, fecha]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al guardar la evaluación:", err);
    res.status(500).json({ error: "Error al guardar la evaluación" });
  }
});

// 📋 Obtener todas las evaluaciones
app.get("/api/evaluaciones", async (req, res) => {
  try {
    const db = await openDb();
    const result = await db.execute("SELECT * FROM evaluaciones ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al cargar las evaluaciones:", err);
    res.status(500).json({ error: "Error al cargar las evaluaciones" });
  }
});

// 🚀 PageSpeed API
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

app.get("/api/pagespeed", async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: "Falta la URL" });

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&key=${GOOGLE_API_KEY}&strategy=mobile&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      return res
        .status(400)
        .json({ error: data.error.message || "Error desconocido de PageSpeed API" });
    }

    res.json(data);
  } catch (err) {
    console.error("Error del servidor al hacer fetch:", err);
    res.status(500).json({ error: "Error al conectar con PageSpeed" });
  }
});

app.get("/api/gemini", async (req, res) => {
  const { url, debug } = req.query;
  if (!url) return res.status(400).json({ error: "Falta la URL" });

  try {
    const start = performance.now();
    const response = await fetch(url);
    const loadTime = Math.round(performance.now() - start);
    const statusCode = response.status;
    const html = await response.text();
    const $ = cheerio.load(html);

    const pageTitle = $("title").text();
    const metaDescription = $('meta[name="description"]').attr("content") || "No detectada";
    const resourcesCount = $("img,script,link").length;

    const prompt = `
Actúa como un **ingeniero QA experto en evaluación de calidad de software web**.
Audita el siguiente sitio con base en las prácticas de Lighthouse, OWASP ZAP, W3C Validator y PageSpeed Insights.

### Información técnica del sitio:
- URL: ${url}
- HTTPS activo: ${url.startsWith("https") ? "Sí" : "No"}
- Estado HTTP: ${statusCode}
- Tiempo de respuesta: ${loadTime} ms
- Título: "${pageTitle || "No detectado"}"
- Descripción: "${metaDescription}"
- Tamaño HTML: ${html.length} caracteres
- Recursos externos: ${resourcesCount}

### Devuelve solo un JSON válido con este formato:
{
  "mantenibilidad": number,
  "compatibilidad": number,
  "fiabilidad": number,
  "portabilidad": number,
  "comentarios": "Breve observación técnica sobre el estado general del sitio"
}
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiResponse.json();

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output_text ||
      "";

    if (debug === "true") {
      // 🔍 muestra TODO lo que devuelve Gemini sin procesar
      return res.json({
        rawText,
        fullResponse: data,
      });
    }

   const cleaned = rawText
  .replace(/```json/i, "")
  .replace(/```/g, "")
  .replace(/^[^{]*({[\s\S]*})[^}]*$/, "$1")
  .trim();

let parsed;
try {
  parsed = JSON.parse(cleaned);

  // 🧮 Escala valores 0–100 → 0–5 si hace falta
  for (const key of ["mantenibilidad", "compatibilidad", "fiabilidad", "portabilidad"]) {
    if (parsed[key] > 10) parsed[key] = (parsed[key] / 20).toFixed(1); // ejemplo: 80 → 4.0
  }

  // 🔍 Asegura que siempre exista comentario
  if (!parsed.comentarios || parsed.comentarios.trim() === "")
    parsed.comentarios = "Sin comentarios generados por Gemini.";

} catch (err) {
  console.error("❌ Error parseando JSON:", err.message);
  parsed = {
    mantenibilidad: 0,
    compatibilidad: 0,
    fiabilidad: 0,
    portabilidad: 0,
    comentarios: rawText || "Sin comentarios procesables de Gemini.",
  };
}


    res.json(parsed);
  } catch (err) {
    console.error("Error al analizar con Gemini:", err);
    res.status(500).json({ error: "Error al conectar o procesar con Gemini" });
  }
});



// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
});
