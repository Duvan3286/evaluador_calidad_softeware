// script.js

let chart;
let evaluacionesGlobales = [];

document.addEventListener("DOMContentLoaded", async () => {
  inicializarSliders();
  await cargarEvaluaciones();
  // habilitarValidacionBootstrap();
});

// Inicializar sliders 
function inicializarSliders() {
  const criteriosArr = [
    { id: "usabilidad", peso: 15 },
    { id: "eficiencia", peso: 15 },
    { id: "seguridad", peso: 15 },
    { id: "mantenibilidad", peso: 10 },
    { id: "compatibilidad", peso: 10 },
    { id: "funcionalidad", peso: 15 },
    { id: "fiabilidad", peso: 10 },
    { id: "portabilidad", peso: 10 },
  ];

  criteriosArr.forEach((c) => {
    const input = document.getElementById(c.id);
    const badge = document.getElementById(`peso-${c.id}`);
    const progressBar = document.getElementById(`bar-${c.id}`);

    let valorSpan = document.getElementById(`valor-${c.id}`);
    if (!valorSpan) {
      valorSpan = document.createElement("span");
      valorSpan.id = `valor-${c.id}`;
      valorSpan.classList.add("ms-2", "fw-bold");
      input.parentNode.appendChild(valorSpan);
    }

    // input.addEventListener("input", () => {
    //   const valor = parseFloat(input.value);
    //   valorSpan.textContent = isNaN(valor) ? "-" : valor.toFixed(2);
    //   progressBar.style.width = isNaN(valor) ? "0%" : `${(valor / 5) * 100}%`;

    //   if (isNaN(valor)) badge.className = "badge bg-secondary";
    //   else if (valor < 2) badge.className = "badge bg-danger";
    //   else if (valor < 3.5) badge.className = "badge bg-warning";
    //   else if (valor < 4.5) badge.className = "badge bg-info";
    //   else badge.className = "badge bg-success";

    //   actualizarPromedioEnTiempoReal();
    // });

    input.dispatchEvent(new Event("input"));
  });
}

// Promedio en tiempo real
// function actualizarPromedioEnTiempoReal() {
//   const criterios = [
//     "usabilidad",
//     "eficiencia",
//     "seguridad",
//     "mantenibilidad",
//     "compatibilidad",
//     "funcionalidad",
//     "fiabilidad",
//     "portabilidad",
//   ];
//   let suma = 0;
//   let count = 0;
//   criterios.forEach((c) => {
//     const val = parseFloat(document.getElementById(c).value);
//     if (!isNaN(val)) {
//       suma += val;
//       count++;
//     }
//   });
//   const promedio = count > 0 ? (suma / count).toFixed(2) : "-";
//   document.getElementById("promedioEnTiempoReal").textContent = promedio;
// }

// Validación Bootstrap
// function habilitarValidacionBootstrap() {
//   const form = document.getElementById("formEvaluacion");
//   form.addEventListener("submit", function (event) {
//     if (!form.checkValidity()) {
//       event.preventDefault();
//       event.stopPropagation();
//     }
//     form.classList.add("was-validated");
//   }, false);
// }

// Enviar evaluación al servidor
// document.getElementById("formEvaluacion").addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const form = e.target;
//   form.classList.add("was-validated");

//   if (!form.checkValidity()) return; // No enviar si campos requeridos están vacíos

//   const app_name = document.getElementById("app_name").value.trim();
//   const descripcion = document.getElementById("descripcion").value.trim();

//   const criterios = [
//     "usabilidad",
//     "eficiencia",
//     "seguridad",
//     "mantenibilidad",
//     "compatibilidad",
//     "funcionalidad",
//     "fiabilidad",
//     "portabilidad",
//   ];

//   const valores = {};
//   let suma = 0;
//   for (let c of criterios) {
//     const valor = parseFloat(document.getElementById(c).value);
//     if (isNaN(valor) || valor < 0 || valor > 5) {
//       alert(`El valor de ${c} debe estar entre 0 y 5`);
//       return;
//     }
//     valores[c] = valor;
//     suma += valor;
//   }

//   const resultado = (suma / criterios.length).toFixed(2);

//   let interpretacion = "";
//   if (resultado < 2) interpretacion = "❌ Calidad baja";
//   else if (resultado < 3.5) interpretacion = "⚠️ Calidad media";
//   else if (resultado < 4.5) interpretacion = "✅ Buena calidad";
//   else interpretacion = "🌟 Excelente calidad";

//   const peor = Object.entries(valores).reduce((a, b) => (a[1] < b[1] ? a : b));
//   const recomendacion = `Se recomienda mejorar la <b>${peor[0]}</b> para aumentar la calidad del software.`;

//   const datos = {
//     app_name,
//     descripcion,
//     resultado: parseFloat(resultado),
//     scores_json: JSON.stringify(valores),
//     pesos_json: JSON.stringify({ modelo: "ISO/IEC 25010" }),
//   };

//   try {
//     const resp = await fetch("http://localhost:3000/api/evaluaciones", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(datos),
//     });

//     if (!resp.ok) throw new Error("Error al guardar la evaluación");

//     mostrarResultado(app_name, resultado, interpretacion, recomendacion);
//     form.reset();
//     inicializarSliders();
//     await cargarEvaluaciones();
//   } catch (error) {
//     alert("Hubo un problema al guardar la evaluación: " + error.message);
//   }
// });

// Mostrar resultado
function mostrarResultado(appName, resultado, interpretacion, recomendacion) {
  const div = document.getElementById("resultado");
  div.classList.remove("d-none");
  div.innerHTML = `
    <h5><b>${appName}</b> obtuvo una calificación promedio de <b>${parseFloat(resultado).toFixed(2)}</b> / 5.00</h5>
    <p>${interpretacion}</p>
    <p>${recomendacion}</p>
  `;
}

// Formatear fecha
function formatearFecha(fecha) {
  try {
    if (typeof fecha === "string" || typeof fecha === "number") fecha = Number(fecha);
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return String(fecha);
    return date.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Bogota",
    });
  } catch {
    return String(fecha);
  }
}

// Cargar evaluaciones
async function cargarEvaluaciones() {
  try {
    // const resp = await fetch("http://localhost:3000/api/evaluaciones");
    const resp = await fetch("/api/evaluaciones");
    const data = await resp.json();

    evaluacionesGlobales = data;
    mostrarEvaluaciones(data);
    actualizarGrafico(data);
    actualizarResumen(data);
  } catch (error) {
    console.error("Error al cargar historial:", error);
  }
}

// Mostrar tabla
function mostrarEvaluaciones(data) {
  const tbody = document.querySelector("#tablaEvaluaciones tbody");
  tbody.innerHTML = "";

  data.forEach((e) => {
    const date = new Date(Number(e.fecha));
    const fechaStr = date.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
    const horaStr = date.toLocaleTimeString("es-CO", { hour12: false, timeZone: "America/Bogota" });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${e.app_name}</td>
      <td>${e.descripcion}</td>
      <td><b>${parseFloat(e.resultado).toFixed(2)}</b></td>
      <td>${fechaStr}</td>
      <td>${horaStr}</td>
      <td>${e.comentario || ""}</td>
    `;
    tbody.appendChild(row);
  });
}

// Gráfico de barras
function actualizarGrafico(data) {
  const ctx = document.getElementById("graficoResultados")?.getContext("2d");
  if (!ctx) return;

  const labels = data.map((e) => e.app_name);
  const resultados = data.map((e) => parseFloat(e.resultado).toFixed(2));

  // Paleta de colores más pulida, con degradados suaves según rendimiento
  const colores = resultados.map((r) => {
    if (r >= 4) return "linear-gradient(180deg, #00C896, #009C77)";     // verde positivo
    if (r >= 3) return "linear-gradient(180deg, #FFD166, #FFB703)";     // amarillo moderado
    if (r >= 2) return "linear-gradient(180deg, #FF9966, #FF6F00)";     // naranja de advertencia
    return "linear-gradient(180deg, #FF7B7B, #E63946)";                 // rojo de bajo desempeño
  });

  // Chart.js no usa gradientes CSS directamente, así que los generamos con CanvasGradient
  const gradientColors = resultados.map((r) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    if (r >= 4) {
      grad.addColorStop(0, "#00C896");
      grad.addColorStop(1, "#009C77");
    } else if (r >= 3) {
      grad.addColorStop(0, "#FFD166");
      grad.addColorStop(1, "#FFB703");
    } else if (r >= 2) {
      grad.addColorStop(0, "#FF9966");
      grad.addColorStop(1, "#FF6F00");
    } else {
      grad.addColorStop(0, "#FF7B7B");
      grad.addColorStop(1, "#E63946");
    }
    return grad;
  });

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Resultado promedio (0 a 5)",
          data: resultados,
          backgroundColor: gradientColors,
          borderRadius: 8,
          borderWidth: 0,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1,
            color: "#0A2540",
            font: { size: 12, weight: "600" },
          },
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            color: "#0A2540",
            font: { size: 12, weight: "600" },
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0A2540",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          cornerRadius: 8,
          padding: 10,
          callbacks: {
            label: (ctx) => `Resultado: ${ctx.parsed.y}`,
          },
        },
        title: {
          display: true,
          text: "Rendimiento promedio de aplicaciones",
          color: "#0A2540",
          font: { size: 16, weight: "700" },
          padding: { top: 10, bottom: 20 },
        },
      },
      animation: {
        duration: 900,
        easing: "easeOutQuart",
      },
    },
  });
}


// === PANEL RESUMEN ===
function actualizarResumen(data = []) {
  const promedioEl = document.getElementById("promedioGeneral");
  const mejorEl = document.getElementById("mejorApp");
  const peorEl = document.getElementById("peorApp");
  const totalEl = document.getElementById("totalEvaluaciones");

  if (!data.length) {
    promedioEl.textContent = "-";
    mejorEl.textContent = "-";
    peorEl.textContent = "-";
    totalEl.textContent = "0";
    return;
  }

  const resultados = data.map(e => Number(e.resultado) || 0);
  const promedio = (resultados.reduce((a, b) => a + b, 0) / resultados.length).toFixed(2);
  const mejor = data.reduce((a, b) => (a.resultado > b.resultado ? a : b));
  const peor = data.reduce((a, b) => (a.resultado < b.resultado ? a : b));

  promedioEl.textContent = promedio;
  mejorEl.textContent = mejor.app_name;
  peorEl.textContent = peor.app_name;
  totalEl.textContent = data.length;

  // animación o color dinámico según el resultado
  aplicarColorPromedio(promedioEl, promedio);
}

function aplicarColorPromedio(el, valor) {
  const promedio = parseFloat(valor);
  el.style.transition = "color 0.3s ease, font-weight 0.3s";
  if (promedio >= 4.5) el.style.color = "#0FA958";        // excelente → verde
  else if (promedio >= 3) el.style.color = "#005F73";     // bueno → azul
  else el.style.color = "#C1121F";                         // bajo → rojo
}



// Filtros
document.getElementById("btnFiltrar").addEventListener("click", () => {
  const nombre = document.getElementById("filtroNombre").value.toLowerCase();
  const min = parseFloat(document.getElementById("filtroMin").value);
  const max = parseFloat(document.getElementById("filtroMax").value);

  const filtrado = evaluacionesGlobales.filter((e) => {
    const cumpleNombre = !nombre || e.app_name.toLowerCase().includes(nombre);
    const cumpleMin = isNaN(min) || e.resultado >= min;
    const cumpleMax = isNaN(max) || e.resultado <= max;
    return cumpleNombre && cumpleMin && cumpleMax;
  });

  mostrarEvaluaciones(filtrado);
});

document.getElementById("btnLimpiar").addEventListener("click", () => {
  document.getElementById("filtroNombre").value = "";
  document.getElementById("filtroMin").value = "";
  document.getElementById("filtroMax").value = "";
  mostrarEvaluaciones(evaluacionesGlobales);
});

document.addEventListener("DOMContentLoaded", () => {
  const radarTab = document.getElementById("radar-tab");
  const selectComparar = document.getElementById("selectComparar");

  radarTab.addEventListener("shown.bs.tab", () => {
    llenarSelectorComparacion();

    // Redibujar cuando cambie la selección
    selectComparar.addEventListener("change", () => {
      actualizarRadarDinamico();
    });

    // Dibujar al abrir si hay evaluaciones cargadas
    actualizarRadarDinamico();
  });

  function llenarSelectorComparacion() {
    selectComparar.innerHTML = "";
    evaluacionesGlobales.forEach((e) => {
      const option = document.createElement("option");
      option.value = e.app_name;
      option.textContent = e.app_name;
      selectComparar.appendChild(option);
    });
  }

  // Actualizar gráfico radar dinámico
  function actualizarRadarDinamico() {
    const ctx = document.getElementById("graficoRadar").getContext("2d");
    if (window.radarChart) window.radarChart.destroy();

    const seleccionadas = Array.from(selectComparar.selectedOptions).map((opt) => opt.value);
    const criterios = [
      "Usabilidad", "Eficiencia", "Seguridad", "Mantenibilidad",
      "Compatibilidad", "Funcionalidad", "Fiabilidad", "Portabilidad"
    ];

    let datasets = [];

    // Si no se elige nada, mostrar solo la primera
    const evaluacionesParaMostrar = seleccionadas.length
      ? evaluacionesGlobales.filter((e) => seleccionadas.includes(e.app_name))
      : evaluacionesGlobales.slice(0, 1);

    evaluacionesParaMostrar.forEach((e, i) => {
      const scores = JSON.parse(e.pesos_json);
      const valores = [
        scores.usabilidad,
        scores.eficiencia,
        scores.seguridad,
        scores.mantenibilidad,
        scores.compatibilidad,
        scores.funcionalidad,
        scores.fiabilidad,
        scores.portabilidad,
      ];

      const color = generarColor(i);
      datasets.push({
        label: e.app_name,
        data: valores,
        fill: true,
        backgroundColor: color.bg,
        borderColor: color.border,
        pointBackgroundColor: color.border,
        pointRadius: 4,
      });
    });

    window.radarChart = new Chart(ctx, {
      type: "radar",
      data: { labels: criterios, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Comparativa de Criterios ISO/IEC 25010" },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 5,
            ticks: { stepSize: 1 },
          },
        },
      },
    });
  }

  // Generar colores para el radar
  function generarColor(i) {
    const colores = [
      { bg: "rgba(54, 162, 235, 0.2)", border: "rgba(54, 162, 235, 1)" },
      { bg: "rgba(255, 99, 132, 0.2)", border: "rgba(255, 99, 132, 1)" },
      { bg: "rgba(255, 206, 86, 0.2)", border: "rgba(255, 206, 86, 1)" },
      { bg: "rgba(75, 192, 192, 0.2)", border: "rgba(75, 192, 192, 1)" },
      { bg: "rgba(153, 102, 255, 0.2)", border: "rgba(153, 102, 255, 1)" },
      { bg: "rgba(255, 159, 64, 0.2)", border: "rgba(255, 159, 64, 1)" },
    ];
    return colores[i % colores.length];
  }
});

// Modal de información
document.addEventListener("DOMContentLoaded", () => {
  const modal = new bootstrap.Modal(document.getElementById("infoModal"));
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  const info = {
    "ISO 25010": `
      <p><strong>ISO/IEC 25010</strong> es una norma internacional que define un <em>modelo de calidad del software</em> con ocho características principales y sus respectivas subcaracterísticas. 
      Su propósito es establecer un lenguaje común para evaluar y mejorar la calidad de los productos de software.</p>
      <ul>
        <li><b>Funcionalidad:</b> grado en que el software cumple con los requisitos especificados.</li>
        <li><b>Fiabilidad:</b> capacidad para mantener el rendimiento bajo condiciones determinadas.</li>
        <li><b>Usabilidad:</b> facilidad de uso, aprendizaje y comprensión por parte del usuario.</li>
        <li><b>Eficiencia:</b> relación entre el rendimiento del software y los recursos utilizados.</li>
        <li><b>Mantenibilidad:</b> facilidad con que se pueden realizar modificaciones.</li>
        <li><b>Portabilidad:</b> facilidad para transferir el software entre entornos.</li>
        <li><b>Compatibilidad:</b> capacidad para operar junto con otros sistemas.</li>
        <li><b>Seguridad:</b> protección de información y datos contra accesos no autorizados.</li>
      </ul>
      <p>Esta norma sustituye a la ISO/IEC 9126, y actualmente constituye el marco conceptual más utilizado para medir la calidad del producto software.</p>
    `,

    "ISO 9001": `
      <p><strong>ISO 9001</strong> es una norma internacional que establece los requisitos para un <em>sistema de gestión de calidad (SGC)</em>. 
      No está centrada en software, pero se aplica ampliamente en organizaciones de desarrollo tecnológico.</p>
      <p>Su objetivo principal es garantizar la mejora continua de los procesos y la satisfacción del cliente mediante:</p>
      <ul>
        <li>Gestión documentada de procesos clave.</li>
        <li>Auditorías internas y revisión del desempeño.</li>
        <li>Control de calidad en cada fase del ciclo de vida del producto.</li>
        <li>Gestión de riesgos y no conformidades.</li>
      </ul>
      <p>Cuando se aplica a ingeniería de software, promueve la estandarización de prácticas y la trazabilidad de los requisitos.</p>
    `,

    "IEEE 730": `
      <p><strong>IEEE 730</strong> establece las directrices para crear un <em>Plan de Aseguramiento de Calidad del Software (SQA Plan)</em>.</p>
      <p>Define las responsabilidades, actividades, herramientas y métodos necesarios para garantizar que los productos de software cumplan los estándares de calidad definidos.</p>
      <p>Entre sus componentes clave se incluyen:</p>
      <ul>
        <li>Definición de estándares y métricas de calidad.</li>
        <li>Procedimientos de revisión, auditoría y verificación.</li>
        <li>Gestión de la configuración y control de cambios.</li>
        <li>Evaluación de riesgos y seguimiento del cumplimiento.</li>
      </ul>
      <p>IEEE 730 es complementaria a ISO 9001 y puede integrarse con modelos de madurez como CMMI.</p>
    `,

    "CMMI": `
      <p><strong>CMMI (Capability Maturity Model Integration)</strong> es un modelo de mejora de procesos desarrollado por el <em>Software Engineering Institute (SEI)</em> de la Universidad Carnegie Mellon.</p>
      <p>Evalúa la madurez organizacional en cinco niveles:</p>
      <ol>
        <li><b>Inicial:</b> procesos impredecibles y mal controlados.</li>
        <li><b>Gestionado:</b> planificación y seguimiento de proyectos.</li>
        <li><b>Definido:</b> procesos estandarizados a nivel organizacional.</li>
        <li><b>Cuantitativamente gestionado:</b> control estadístico de procesos.</li>
        <li><b>Optimización:</b> mejora continua basada en métricas.</li>
      </ol>
      <p>CMMI proporciona una hoja de ruta para alcanzar la excelencia operativa en desarrollo y mantenimiento de software.</p>
    `,

    "TMMI": `
      <p><strong>TMMI (Test Maturity Model Integration)</strong> es un modelo de madurez que complementa a CMMI, pero enfocado exclusivamente en los <em>procesos de prueba de software</em>.</p>
      <p>Sus objetivos son profesionalizar la práctica de pruebas, aumentar la eficiencia y garantizar la trazabilidad entre requisitos y validación.</p>
      <p>Los niveles de madurez del TMMI son:</p>
      <ol>
        <li>Inicial — pruebas no estructuradas.</li>
        <li>Gestionado — planificación básica de pruebas.</li>
        <li>Definido — procesos y roles formales.</li>
        <li>Medido — uso sistemático de métricas.</li>
        <li>Optimizado — mejora continua y automatización.</li>
      </ol>
    `,

    "Moprosoft": `
      <p><strong>Moprosoft</strong> (Modelo de Procesos para la Industria del Software) es un estándar mexicano basado en <em>ISO 9001</em> y <em>CMMI</em>, diseñado para pequeñas y medianas empresas de software.</p>
      <p>Organiza los procesos en tres categorías:</p>
      <ul>
        <li><b>Alta dirección:</b> gestión estratégica y mejora continua.</li>
        <li><b>Gerencia:</b> administración de proyectos, recursos y calidad.</li>
        <li><b>Operación:</b> desarrollo, mantenimiento y soporte técnico.</li>
      </ul>
      <p>Su propósito es aumentar la competitividad y calidad del software mexicano a través de procesos estandarizados y medibles.</p>
    `
  };

  document.querySelectorAll(".info-item").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.textContent.trim();
      modalTitle.textContent = key;
      modalBody.innerHTML = info[key] || "<p>Información no disponible.</p>";
      modal.show();
    });
  });
});

  document.addEventListener('DOMContentLoaded', function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });


// ===========================================
// CONFIGURACIÓN DE EVENTOS DEL EVALUADOR
// ===========================================

const form = document.getElementById("formEvaluacion");
const urlInput = document.getElementById("url_sitio"); // Referencia al campo URL
const resultadoDiv = document.getElementById("resultado");
const pageSpeedResultados = document.getElementById("pageSpeedResultados");
const promedioSpan = document.getElementById("promedioEnTiempoReal");

// Sliders automáticos que se deshabilitarán y llenarán con PageSpeed
const automaticSliders = ["usabilidad", "eficiencia", "seguridad", "funcionalidad"];
// Sliders manuales que requieren la intervención del usuario
const manualSliders = ["mantenibilidad", "compatibilidad", "fiabilidad", "portabilidad"];

// Pesos según el HTML (la suma total es 100%)
const pesos = {
    usabilidad: 0.15, // 15% - Mapeado a Accessibility
    eficiencia: 0.15, // 15% - Mapeado a Performance
    seguridad: 0.15, // 15% - Mapeado a SEO
    funcionalidad: 0.15, // 15% - Mapeado a Best Practices
    mantenibilidad: 0.10, // 10% - Manual
    compatibilidad: 0.10, // 10% - Manual
    fiabilidad: 0.10, // 10% - Manual
    portabilidad: 0.10, // 10% - Manual
};

/**
 * Función para calcular y mostrar el promedio ponderado en tiempo real (0-5).
 */
function actualizarPromedio() {
    // Obtener los valores de todos los sliders (automáticos y manuales)
    const usabilidad = parseFloat(document.getElementById("usabilidad").value) || 0;
    const eficiencia = parseFloat(document.getElementById("eficiencia").value) || 0;
    const seguridad = parseFloat(document.getElementById("seguridad").value) || 0;
    const funcionalidad = parseFloat(document.getElementById("funcionalidad").value) || 0;
    
    const mantenibilidad = parseFloat(document.getElementById("mantenibilidad").value) || 0;
    const compatibilidad = parseFloat(document.getElementById("compatibilidad").value) || 0;
    const fiabilidad = parseFloat(document.getElementById("fiabilidad").value) || 0;
    const portabilidad = parseFloat(document.getElementById("portabilidad").value) || 0;
    
    const promedioPonderado = (
        (usabilidad * pesos.usabilidad) +
        (eficiencia * pesos.eficiencia) +
        (seguridad * pesos.seguridad) +
        (funcionalidad * pesos.funcionalidad) +
        (mantenibilidad * pesos.mantenibilidad) +
        (compatibilidad * pesos.compatibilidad) +
        (fiabilidad * pesos.fiabilidad) +
        (portabilidad * pesos.portabilidad)
    ).toFixed(2);

    promedioSpan.textContent = promedioPonderado;
}


/**
 * Función para obtener métricas desde el backend (que llama a PageSpeed API).
 * @param {string} url - URL del sitio a evaluar.
 * @returns {Promise<Object>} Datos de la API de PageSpeed.
 */
// ====================================================
// 📊 FUNCIÓN PRINCIPAL: obtener métricas automáticas
// ====================================================
async function evaluarSitio(url) {
  const loading = document.getElementById("loadingIA");
  const resultadoDiv = document.getElementById("resultado");
  const promedioEl = document.getElementById("promedioEnTiempoReal");

  // 🧹 LIMPIAR RESULTADOS ANTERIORES
  if (resultadoDiv) {
    resultadoDiv.classList.add("d-none");
    resultadoDiv.innerHTML = ""; // limpia resultados viejos
  }

  if (promedioEl) promedioEl.textContent = "-";

  // Reiniciar etiquetas de cada criterio
  [
    "usabilidad",
    "eficiencia",
    "seguridad",
    "funcionalidad",
    "mantenibilidad",
    "compatibilidad",
    "fiabilidad",
    "portabilidad",
  ].forEach((nombre) => {
    const input = document.getElementById(nombre);
    const bar = document.getElementById(`bar-${nombre}`);
    const label = document.getElementById(`${nombre}Valor`);
    if (input) input.value = 0;
    if (bar) bar.style.width = "0%";
    if (label) label.textContent = "-";
  });

  try {
    // Mostrar spinner
    if (loading) {
      loading.classList.remove("d-none");
      document.body.style.overflow = "hidden";
    }

    // --- 1️⃣ Llamado a la API de PageSpeed ---
    const res = await fetch(`/api/pagespeed?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const categories = data.lighthouseResult?.categories || {};
    const performance = categories.performance?.score ? categories.performance.score * 100 : 0;
    const accessibility = categories.accessibility?.score ? categories.accessibility.score * 100 : 0;
    const bestPractices = categories["best-practices"]?.score ? categories["best-practices"].score * 100 : 0;
    const seo = categories.seo?.score ? categories.seo.score * 100 : 0;

    // Convertir a escala 0–5
    let usabilidadValue = (accessibility / 20).toFixed(1);
    let eficienciaValue = (performance / 20).toFixed(1);
    let seguridadValue = (seo / 20).toFixed(1);
    let funcionalidadValue = (bestPractices / 20).toFixed(1);

    console.log("📊 Métricas de PageSpeed:", { performance, accessibility, bestPractices, seo });

    // --- 2️⃣ Llamado a Gemini ---
    const geminiRes = await fetch(`/api/gemini?url=${encodeURIComponent(url)}`);
    window.geminiData = await geminiRes.json();
    const geminiData = window.geminiData;
    console.log("🤖 Evaluación adicional (Gemini):", geminiData);

    // --- 3️⃣ Combinar valores ---
    const criterios = {
      usabilidad: parseFloat(usabilidadValue),
      eficiencia: parseFloat(eficienciaValue),
      seguridad: parseFloat(seguridadValue),
      funcionalidad: parseFloat(funcionalidadValue),
      mantenibilidad: geminiData.mantenibilidad || 0,
      compatibilidad: geminiData.compatibilidad || 0,
      fiabilidad: geminiData.fiabilidad || 0,
      portabilidad: geminiData.portabilidad || 0,
    };

    // --- 4️⃣ Actualizar sliders ---
    Object.entries(criterios).forEach(([nombre, val]) => {
      const input = document.getElementById(nombre);
      const bar = document.getElementById(`bar-${nombre}`);
      const label = document.getElementById(`${nombre}Valor`);
      if (input) input.value = val;
      if (bar) bar.style.width = `${(val / 5) * 100}%`;
      if (label) label.textContent = val.toFixed(1);
    });

    // --- 5️⃣ Promedio total ---
    const promedio =
      Object.values(criterios).reduce((a, b) => a + parseFloat(b), 0) /
      Object.keys(criterios).length;

    promedioEl.textContent = promedio.toFixed(2);

    // --- 6️⃣ Mostrar resultados ---
    resultadoDiv.innerHTML = `
      <h4>Resultados del Análisis</h4>
      <ul>
        <li><b>Usabilidad:</b> ${criterios.usabilidad.toFixed(1)}</li>
        <li><b>Eficiencia:</b> ${criterios.eficiencia.toFixed(1)}</li>
        <li><b>Seguridad:</b> ${criterios.seguridad.toFixed(1)}</li>
        <li><b>Funcionalidad:</b> ${criterios.funcionalidad.toFixed(1)}</li>
        <li><b>Mantenibilidad:</b> ${criterios.mantenibilidad.toFixed(1)}</li>
        <li><b>Compatibilidad:</b> ${criterios.compatibilidad.toFixed(1)}</li>
        <li><b>Fiabilidad:</b> ${criterios.fiabilidad.toFixed(1)}</li>
        <li><b>Portabilidad:</b> ${criterios.portabilidad.toFixed(1)}</li>
      </ul>
      <p><b>Promedio general:</b> ${promedio.toFixed(2)}</p>
      <p><b>Comentarios:</b> ${geminiData.comentarios || "Sin comentarios disponibles."}</p>
    `;
    resultadoDiv.classList.remove("d-none");

    return criterios;
  } catch (err) {
    console.error("❌ Error obteniendo métricas:", err);
    alert("Ocurrió un error al analizar la URL. Verifica la dirección e intenta nuevamente.");
  } finally {
    if (loading) {
      loading.classList.add("d-none");
      document.body.style.overflow = "auto";
    }
  }
}




/**
 * Limpia todos los campos, barras y resultados para iniciar una nueva evaluación.
 */
function resetEvaluacion() {
  const form = document.getElementById("formEvaluacion");
  const resultadoDiv = document.getElementById("resultado");
  const resultadoCard = document.getElementById("resultadoCard");
  const pageSpeedResultados = document.getElementById("pageSpeedResultados");
  const promedioEl = document.getElementById("promedioEnTiempoReal");

  // --- 1️⃣ Resetear formulario ---
  if (form) form.reset();

  // --- 2️⃣ Ocultar y limpiar resultados ---
  if (resultadoDiv) {
    resultadoDiv.classList.add("d-none");
    resultadoDiv.classList.remove("alert-success", "alert-danger", "alert-info");
    resultadoDiv.innerHTML = ""; // 💡 Limpia por completo el resultado del análisis (Gemini + PageSpeed)
  }

  if (resultadoCard) resultadoCard.classList.add("d-none");

  // --- 3️⃣ Limpiar texto de resultados de PageSpeed ---
  if (pageSpeedResultados) pageSpeedResultados.innerHTML = "";

  // --- 4️⃣ Resetear sliders, barras y etiquetas ---
  const criterios = [
    "usabilidad",
    "eficiencia",
    "seguridad",
    "funcionalidad",
    "mantenibilidad",
    "compatibilidad",
    "fiabilidad",
    "portabilidad"
  ];

  criterios.forEach(id => {
    const slider = document.getElementById(id);
    const bar = document.getElementById(`bar-${id}`);
    const label = document.getElementById(`${id}Valor`);

    if (slider) slider.value = 0;
    if (bar) {
      bar.style.width = "0%";
      bar.textContent = "";
    }
    if (label) label.textContent = "0.0";
  });

  // --- 5️⃣ Reiniciar promedio ---
  if (promedioEl) promedioEl.textContent = "-";

  // --- 6️⃣ Limpiar datos globales en memoria ---
  window.geminiData = null;
  console.log("🔄 Evaluación reiniciada correctamente.");
}



/**
 * Función para guardar la evaluación en la BD.
 * @param {Object} datos - Datos a guardar.
 */
async function guardarEvaluacion(datos) {
  const res = await fetch("/api/evaluaciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Error al guardar en la base de datos.");
  }

  // ✅ Si se guarda correctamente:
  const result = await res.json();

  // 🧹 LIMPIAR INTERFAZ DESPUÉS DE GUARDAR
  const resultadoDiv = document.getElementById("resultado");
  if (resultadoDiv) {
    resultadoDiv.innerHTML = "";
    resultadoDiv.classList.add("d-none");
  }

  const promedio = document.getElementById("promedioEnTiempoReal");
  if (promedio) promedio.textContent = "-";

  // Reiniciar sliders y etiquetas
  [
    "usabilidad",
    "eficiencia",
    "seguridad",
    "funcionalidad",
    "mantenibilidad",
    "compatibilidad",
    "fiabilidad",
    "portabilidad",
  ].forEach((nombre) => {
    const input = document.getElementById(nombre);
    const bar = document.getElementById(`bar-${nombre}`);
    const label = document.getElementById(`${nombre}Valor`);
    if (input) input.value = 0;
    if (bar) bar.style.width = "0%";
    if (label) label.textContent = "-";
  });

  // 🔄 Borrar datos de Gemini
  window.geminiData = null;

  // // ✅ Mostrar confirmación
  // alert("Evaluación guardada exitosamente.");

  return result;
}


// ===========================================
// EVENT LISTENERS
// ===========================================

// 1. Ejecutar evaluación al perder el foco del campo URL (blur)
urlInput.addEventListener("blur", () => {
    const url_sitio = urlInput.value.trim();
    evaluarSitio(url_sitio);
});

// 2. Asignar el evento 'input' a todos los sliders para actualizar el promedio en tiempo real
// EVENT LISTENERS (Bloque revisado)
document.querySelectorAll('input[type="range"]').forEach(slider => {
    
    const sliderId = slider.id;
    const maxVal = parseFloat(slider.getAttribute('max'));
    
    if (automaticSliders.includes(sliderId)) {
        slider.disabled = true;
    }

    // if (manualSliders.includes(sliderId) && (parseFloat(slider.value) || 0) === 0) {
    //     slider.value = 3.0; 
    // }
    if (automaticSliders.includes(sliderId)) {
    slider.disabled = true;
}


    slider.addEventListener('input', () => {
     
        const currentVal = parseFloat(slider.value);
        const percentage = (currentVal / maxVal) * 100;

        const badge = document.getElementById(`peso-${sliderId}`);
        if (isNaN(currentVal)) badge.className = "badge bg-secondary";
        else if (currentVal < 2) badge.className = "badge bg-danger";
        else if (currentVal < 3.5) badge.className = "badge bg-warning";
        else if (currentVal < 4.5) badge.className = "badge bg-info";
        else badge.className = "badge bg-success";

        const valorSpan = document.getElementById(`valor-${sliderId}`);
        if (valorSpan) valorSpan.textContent = isNaN(currentVal) ? "-" : currentVal.toFixed(2);
        
        const progressBar = document.getElementById(`bar-${sliderId}`);
        if (progressBar) progressBar.style.width = isNaN(currentVal) ? "0%" : `${percentage}%`;

        actualizarPromedio();
    });
    
    slider.dispatchEvent(new Event("input"));
    
});

// ==========================================================
// 🔹 FUNCIÓN PARA APLICAR RESULTADOS AUTOMÁTICOS DE GEMINI
// ==========================================================
function aplicarResultadosGemini(resultados) {
  if (!resultados) return;

  const map = {
    usabilidad: resultados.usabilidad,
    eficiencia: resultados.eficiencia,
    seguridad: resultados.seguridad,
    mantenibilidad: resultados.mantenibilidad
  };

  Object.entries(map).forEach(([id, valor]) => {
    const slider = document.getElementById(id);
    const barra = document.getElementById(`bar-${id}`);

    if (slider && valor !== undefined) {
      slider.value = valor.toFixed(1);
      slider.dispatchEvent(new Event("input"));
    }

    if (barra) barra.style.width = `${(valor / 5) * 100}%`;
  });

  // Mostrar comentario (si viene)
  if (resultados.comentarios) {
    const resultadoDiv = document.getElementById("resultado");
    const pageSpeedResultados = document.getElementById("pageSpeedResultados");

    resultadoDiv.classList.remove("d-none", "alert-info");
    resultadoDiv.classList.add("alert-success");
    pageSpeedResultados.innerHTML += `
      <h6>Evaluación cualitativa</h6>
      <p>${resultados.comentarios}</p>
    `;
  }

  actualizarPromedio();
}



// 3. Evento de envío del formulario (Guardar)
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
        // Si la validación falla (campos vacíos), no hacer nada
        return;
    }

    // Deshabilitar botón para evitar envíos dobles
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";


    const app_name = document.getElementById("app_name").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const url_sitio = document.getElementById("url_sitio").value.trim();

    try {
        // Obtener los scores de PageSpeed que ya se calcularon (o 0 si falló o no se ejecutó)
        // Se multiplica el valor del slider (0-5) por 20 para obtener el score de 0-100
        const performance = parseFloat(document.getElementById("eficiencia").value) * 20;
        const accessibility = parseFloat(document.getElementById("usabilidad").value) * 20;
        const bestPractices = parseFloat(document.getElementById("funcionalidad").value) * 20;
        const seo = parseFloat(document.getElementById("seguridad").value) * 20;
        
        const resultadoFinal = promedioSpan.textContent; // Obtener el promedio calculado

        await guardarEvaluacion({
            app_name,
            descripcion,
            // Guardar el promedio final
            resultado: resultadoFinal, 
            // Guardar los scores de PageSpeed (0-100)
            scores_json: JSON.stringify({ 
                performance: performance.toFixed(0), 
                accessibility: accessibility.toFixed(0), 
                bestPractices: bestPractices.toFixed(0), 
                seo: seo.toFixed(0) 
            }), 
            // Guardar los valores de todos los sliders (0-5)
            pesos_json: JSON.stringify({ 
                usabilidad: document.getElementById("usabilidad").value, 
                eficiencia: document.getElementById("eficiencia").value, 
                funcionalidad: document.getElementById("funcionalidad").value, 
                seguridad: document.getElementById("seguridad").value,
                mantenibilidad: document.getElementById("mantenibilidad").value,
                compatibilidad: document.getElementById("compatibilidad").value,
                fiabilidad: document.getElementById("fiabilidad").value,
                portabilidad: document.getElementById("portabilidad").value
            }),
             comentario: window.geminiData?.comentarios || "Sin comentarios generados"
        });
        await cargarEvaluaciones();
        resultadoDiv.classList.remove("alert-danger", "alert-info");
        resultadoDiv.classList.add("alert-success");
        pageSpeedResultados.innerHTML += `<div class="mt-2 text-center">✅ Evaluación guardada exitosamente.</div>`;
        
         

    } catch (err) {
        console.error("Error al guardar la evaluación:", err);
        resultadoDiv.classList.remove("alert-success", "alert-info");
        resultadoDiv.classList.add("alert-danger");
        pageSpeedResultados.innerHTML = `❌ Error al guardar la evaluación. <br>Detalle: ${err.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar Evaluación";
        form.reset(); 
        inicializarSliders();
    }
});

// Inicializar el promedio al cargar la página
actualizarPromedio();
resetEvaluacion();


// ===============================
// 🔹 Inicialización del sistema
// ===============================

// Esperar a que el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-evaluacion");
  const btnAnalizar = document.getElementById("btn-analizar");

  if (form && btnAnalizar) {
    btnAnalizar.addEventListener("click", async (e) => {
      e.preventDefault();
      const url = document.getElementById("url").value.trim();

      if (!url) {
        alert("Por favor ingresa una URL válida para analizar.");
        return;
      }

      if (loading) {
        loading.classList.remove("d-none");
        document.body.style.overflow = "hidden";
      }

      // Ejecutar análisis
      const resultados = await evaluarSitio(url);

      // Ocultar loader y restaurar scroll
      if (loading) {
        loading.classList.add("d-none");
        document.body.style.overflow = "auto";
      }

      if (resultados) {
        console.log("✅ Evaluación completada:", resultados);
      } else {
        console.warn("❌ Falló la evaluación del sitio.");
      }
    });
  }

  console.log("✨ Sistema de evaluación listo.");
});

// evento para borrar todo el historial
document.getElementById("btnBorrarTodo")?.addEventListener("click", async () => {
  const confirmacion = await Swal.fire({
    title: "¿Eliminar todo el historial?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar todo",
    cancelButtonText: "Cancelar"
  });

  if (!confirmacion.isConfirmed) return;

  try {
    const res = await fetch("/api/evaluaciones", { method: "DELETE" });
    const data = await res.json();

    await Swal.fire({
      title: "Resultado",
      text: data.message || "Historial borrado correctamente ✅",
      icon: data.message.includes("No hay registros") ? "info" : "success",
      confirmButtonColor: "#3085d6"
    });

    // Recargar tabla o página
    if (typeof cargarHistorial === "function") {
      await cargarHistorial();
    } else {
      location.reload();
    }

  } catch (err) {
    console.error("Error borrando historial:", err);
    Swal.fire({
      title: "Error",
      text: "❌ Ocurrió un error al intentar borrar el historial.",
      icon: "error",
      confirmButtonColor: "#d33"
    });
  }
});

