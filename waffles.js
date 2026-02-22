const URL_APPS_SCRIPT = CONFIG.URL_APPS_SCRIPT;
const PACKS_POR_JARRA = 6;

let datosLote = null; // { fecha, lote, jarras }


// =====================================
// INIT
// =====================================

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const fecha  = params.get("fecha");
  const lote   = params.get("lote");
  const jarras = params.get("jarras");

  if (fecha && lote && jarras) {
    try {
      const jarrasObj = JSON.parse(jarras);
      datosLote = { fecha, lote: Number(lote), jarras: jarrasObj };
      mostrarForm(datosLote);
      document.getElementById("spinner-overlay").style.display = "none";
      document.getElementById("app").style.display = "block";
    } catch {
      mostrarBusqueda();
    }
  } else {
    mostrarBusqueda();
  }
});

function mostrarBusqueda() {
  document.getElementById("spinner-overlay").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("seccion-buscar").style.display = "block";
}


// =====================================
// BUSCAR POR FECHA
// =====================================

function buscarPorFecha() {
  const fecha = document.getElementById("input-fecha-buscar").value;
  const errorDiv = document.getElementById("buscar-error");

  if (!fecha) {
    errorDiv.textContent = "Seleccioná una fecha.";
    errorDiv.style.display = "block";
    return;
  }

  errorDiv.style.display = "none";
  document.getElementById("spinner-overlay").style.display = "flex";

  fetch(`${URL_APPS_SCRIPT}?action=getByFecha&fecha=${fecha}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("spinner-overlay").style.display = "none";

      if (data.status === "error") {
        errorDiv.textContent = data.message || "No se encontró producción para esa fecha.";
        errorDiv.style.display = "block";
        return;
      }

      datosLote = { fecha: data.fecha, lote: data.lote, jarras: data.jarras };
      mostrarForm(datosLote);
      document.getElementById("seccion-buscar").style.display = "none";
    })
    .catch(() => {
      document.getElementById("spinner-overlay").style.display = "none";
      errorDiv.textContent = "Error de conexión. Intentá de nuevo.";
      errorDiv.style.display = "block";
    });
}


// =====================================
// MOSTRAR FORM
// =====================================

function mostrarForm(datos) {
  const { fecha, lote, jarras } = datos;

  // Info lote
  const fechaObj = new Date(fecha + "T12:00:00");
  const fechaStr = fechaObj.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  document.getElementById("info-lote-waffle").innerHTML =
    `Lote <strong>#${lote}</strong> — cocinado el <strong>${fechaStr}</strong>`;

  document.getElementById("seccion-info").style.display = "block";
  document.getElementById("seccion-form").style.display = "block";
  document.getElementById("submit-area-waffle").style.display = "block";

  // Filas por sabor
  const container = document.getElementById("waffle-filas");
  container.innerHTML = "";

  Object.entries(jarras).forEach(([sabor, cantJarras]) => {
    const maxEsperado = cantJarras * PACKS_POR_JARRA;

    const fila = document.createElement("div");
    fila.classList.add("waffle-fila");
    fila.setAttribute("data-sabor", sabor);

    fila.innerHTML = `
      <span class="waffle-sabor">${sabor}</span>
      <span class="waffle-jarras">${cantJarras} jarras</span>
      <input
        type="number"
        class="campo-input waffle-packs"
        min="0"
        max="${maxEsperado}"
        placeholder="0"
        oninput="calcularProductividad(this, ${cantJarras})"
      >
      <span class="waffle-prod" id="prod-${sabor}">—</span>
    `;

    container.appendChild(fila);
  });
}


// =====================================
// CALCULAR PRODUCTIVIDAD
// =====================================

function calcularProductividad(input, jarras) {
  const fila = input.closest(".waffle-fila");
  const sabor = fila.getAttribute("data-sabor");
  const packs = Number(input.value);
  const esperado = jarras * PACKS_POR_JARRA;
  const prodSpan = document.getElementById(`prod-${sabor}`);

  if (!input.value) {
    prodSpan.textContent = "—";
    prodSpan.className = "waffle-prod";
  } else {
    const pct = ((packs / esperado) * 100).toFixed(1);
    prodSpan.textContent = `${pct}%`;
    prodSpan.className = `waffle-prod ${Number(pct) >= 85 ? "prod-ok" : "prod-baja"}`;
  }

  calcularTotalProductividad();
}

function calcularTotalProductividad() {
  const filas = document.querySelectorAll(".waffle-fila");
  let totalPacks = 0;
  let totalEsperado = 0;
  let completo = true;

  filas.forEach(fila => {
    const sabor = fila.getAttribute("data-sabor");
    const jarras = datosLote.jarras[sabor];
    const packsInput = fila.querySelector(".waffle-packs");
    const packs = Number(packsInput.value);

    if (!packsInput.value) { completo = false; return; }

    totalPacks += packs;
    totalEsperado += jarras * PACKS_POR_JARRA;
  });

  const totalSpan = document.getElementById("productividad-total");

  if (!completo || totalEsperado === 0) {
    totalSpan.textContent = "—";
    totalSpan.className = "prod-valor";
    return;
  }

  const pct = ((totalPacks / totalEsperado) * 100).toFixed(1);
  totalSpan.textContent = `${pct}%`;
  totalSpan.className = `prod-valor ${Number(pct) >= 85 ? "prod-ok" : "prod-baja"}`;
}


// =====================================
// GUARDAR WAFFLES
// =====================================

function guardarWaffles() {
  const filas = document.querySelectorAll(".waffle-fila");
  const waffles = {};
  let valido = true;

  filas.forEach(fila => {
    const sabor = fila.getAttribute("data-sabor");
    const packs = fila.querySelector(".waffle-packs").value;
    if (packs === "") { valido = false; return; }
    waffles[sabor] = {
      jarras: datosLote.jarras[sabor],
      packs: Number(packs),
      productividad: ((Number(packs) / (datosLote.jarras[sabor] * PACKS_POR_JARRA)) * 100).toFixed(1)
    };
  });

  if (!valido) {
    alert("Completá los packs efectivos de todos los sabores.");
    return;
  }

  const btnGuardar = document.querySelector("#submit-area-waffle .btn-submit");
  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  fetch(URL_APPS_SCRIPT, {
    method: "POST",
    body: JSON.stringify({
      action: "guardarWaffles",
      fecha: datosLote.fecha,
      lote: datosLote.lote,
      waffles
    })
  })
    .then(res => res.json())
    .then(response => {
      if (response.status === "error") {
        alert("Error: " + response.message);
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Waffles";
        return;
      }
      alert("✅ Waffles guardados correctamente");
      window.location.href = "index.html";
    })
    .catch(() => {
      alert("Error al guardar. Intentá de nuevo.");
      btnGuardar.disabled = false;
      btnGuardar.textContent = "Guardar Waffles";
    });
}