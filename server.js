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

// Servir la carpeta "public" (HTML, CSS, JS)
app.use(express.static("public"));

// Borrar todos los registros
app.delete("/api/evaluaciones", async (req, res) => {
  try {
    const db = await openDb();

    // Contar cuántos registros existen antes de borrar
    const row = await db.get("SELECT COUNT(*) AS total FROM evaluaciones");

    if (!row || row.total === 0) {
      return res.status(200).json({ message: "⚠️ No hay registros para borrar." });
    }

    // Si sí hay registros, eliminarlos
    await db.run("DELETE FROM evaluaciones");

    res.json({ message: "✅ Todos los registros fueron eliminados correctamente." });
  } catch (err) {
    console.error("Error al borrar todos los registros:", err);
    res.status(500).json({ error: "Error al borrar todos los registros." });
  }
});




// Crear nueva evaluación
app.post("/api/evaluaciones", async (req, res) => {
  try {
    const { app_name, descripcion, resultado, scores_json, pesos_json, comentario } = req.body;
    const db = await openDb();
    const fecha = Date.now();

    await db.run(
      `INSERT INTO evaluaciones (app_name, descripcion, resultado, scores_json, pesos_json, comentario, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [app_name, descripcion, resultado, scores_json, pesos_json, comentario, fecha]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar la evaluación" });
  }
});

// Obtener todas las evaluaciones
app.get("/api/evaluaciones", async (req, res) => {
  try {
    const db = await openDb();
    const evaluaciones = await db.all("SELECT * FROM evaluaciones ORDER BY fecha DESC");
    res.json(evaluaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cargar las evaluaciones" });
  }
});

// API Key de Google PageSpeed
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;


app.get("/api/pagespeed", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Falta la URL" });
  }

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&key=${GOOGLE_API_KEY}&strategy=mobile&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log("📊 Respuesta completa PageSpeed:", data);

    if (data.error) {
      console.error("--- Error DETALLADO de la API de PageSpeed ---");
      console.error(data.error);
      console.error("-----------------------------------------------");
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

// 🔹 Nuevo endpoint: Evaluación automática con Gemini (versión QA real)
app.get("/api/gemini", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Falta la URL" });

  try {
    // 🕵️‍♂️ Recolección de información real del sitio
    const start = performance.now();
    const response = await fetch(url);
    const loadTime = Math.round(performance.now() - start);
    const statusCode = response.status;
    const html = await response.text();
    const $ = cheerio.load(html);

    const pageTitle = $("title").text();
    const metaDescription = $('meta[name="description"]').attr("content") || "No detectada";
    const resourcesCount = $("img,script,link").length;

    // 🧠 Prompt QA técnico con contexto real
    const prompt = `
Actúa como un **ingeniero QA experto en evaluación de calidad de software web**.
Tu tarea es auditar la siguiente página web con un enfoque técnico, simulando una revisión real con herramientas como Lighthouse, OWASP ZAP, W3C Validator y PageSpeed Insights.

### Información técnica del sitio:
- URL: ${url}
- HTTPS activo: ${url.startsWith("https") ? "Sí" : "No"}
- Estado HTTP: ${statusCode}
- Tiempo de respuesta: ${loadTime} ms
- Título: "${pageTitle || "No detectado"}"
- Descripción: "${metaDescription}"
- Tamaño HTML: ${html.length} caracteres
- Recursos externos (imágenes, scripts, hojas de estilo): ${resourcesCount}

### Criterios de evaluación (escala 0–5, permite decimales):
1. **Usabilidad:** Navegación, estructura visual, etiquetas accesibles, claridad de interacción.
2. **Eficiencia:** Optimización del código, carga de recursos, peso de la página.
3. **Seguridad:** HTTPS, formularios seguros, cabeceras, políticas de privacidad.
4. **Funcionalidad:** Enlaces válidos, formularios operativos, estructura HTML coherente.
5. **Mantenibilidad:** Orden del código, legibilidad, uso coherente de clases y comentarios.
6. **Compatibilidad:** Diseño responsive, uso del meta viewport, compatibilidad con navegadores.
7. **Fiabilidad:** Estabilidad, ausencia de errores visibles, dependencias seguras.
8. **Portabilidad:** Facilidad para desplegar o migrar a otros entornos.

### HTML (truncado a 5000 caracteres):
${html.substring(0, 5000)}

### Requisitos de salida:
Devuelve **únicamente un JSON válido** con este formato exacto:
{
  "usabilidad": number,
  "eficiencia": number,
  "seguridad": number,
  "funcionalidad": number,
  "mantenibilidad": number,
  "compatibilidad": number,
  "fiabilidad": number,
  "portabilidad": number,
  "comentarios": "Breve observación técnica sobre hallazgos QA"
}
    `;

    // 🔗 Enviar el prompt a Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiResponse.json();

    // 🧩 Mostrar respuesta completa en consola (debug)
    console.log("=== RESPUESTA COMPLETA DE GEMINI ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("====================================");

    if (data.error) {
      console.error("⚠️ Error desde la API de Gemini:", data.error);
      return res.status(400).json({ error: data.error });
    }

    // 🧠 Extraer y limpiar el texto JSON
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output_text ||
      "";

    let parsed;
    try {
      const cleaned = text.replace(/```json/i, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw_output: text || "Sin salida procesable de Gemini" };
    }

    // ✅ Respuesta final al frontend
    res.json(parsed);

  } catch (err) {
    console.error("Error al analizar con Gemini:", err);
    res.status(500).json({ error: "Error al conectar o procesar con Gemini" });
  }
});

// 🚀 Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
});
