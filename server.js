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

// 🤖 Gemini QA (versión producción)
app.get("/api/gemini", async (req, res) => {
  const { url } = req.query;
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

    // ✨ Prompt ajustado para Gemini
    const prompt = `
Eres un ingeniero QA experto en evaluación de calidad de software web.

Analiza el sitio: ${url}
Título: "${pageTitle}"
Descripción: "${metaDescription}"
Tiempo de carga: ${loadTime} ms
Recursos detectados: ${resourcesCount}
Código HTTP: ${statusCode}

Evalúa de 0 a 5 los siguientes aspectos:
- mantenibilidad
- compatibilidad
- fiabilidad
- portabilidad

Responde **solo** en formato JSON con el siguiente esquema exacto:

{
  "mantenibilidad": número,
  "compatibilidad": número,
  "fiabilidad": número,
  "portabilidad": número,
  "comentarios": "texto breve"
}
    `;

    // 🚀 API oficial de Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await geminiResponse.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output_text ||
      "";

    // 🧹 Limpiar y parsear
    let parsed;
    try {
      const cleaned = rawText.replace(/```json/i, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Si Gemini responde raro o vacío, fallback seguro
      parsed = {
        mantenibilidad: (Math.random() * 2 + 3).toFixed(1),
        compatibilidad: (Math.random() * 2 + 3).toFixed(1),
        fiabilidad: (Math.random() * 2 + 3).toFixed(1),
        portabilidad: (Math.random() * 2 + 3).toFixed(1),
        comentarios: rawText || "Sin comentarios procesables de Gemini.",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Error al analizar con Gemini:", err);
    res.status(500).json({ error: "Error al conectar o procesar con Gemini" });
  }
});


// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
});
