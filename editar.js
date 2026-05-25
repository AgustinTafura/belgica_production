const URL_APPS_SCRIPT = CONFIG.URL_APPS_SCRIPT;

let loteActual = null;
let datosOriginales = null;
let contadorMateria = 0;
let contadorSabor = 0;

const SABORES = ["AV", "CH", "BA", "CO", "CB", "AM", "SA", "VAV"];

const materiasConfig = {
  "AVENA": ["AGROINDISTRIA TRES ARROYOS", "ARROYO SECO DISTRIDIET", "INDUSTRIAS DE AVENA"],
  "BANANA": ["VERDULERIA"],
  "CACAO DARK": ["BARRY CALLEBAUT", "FENIX"],
  "CACAO RED": ["FENIX", "BARRY CALLEBAUT"],
  "COCO": ["CUMAN/BAVOSI", "LODISER", "MELAR"],
  "EXTRACTO": ["ESPECIAS EL CASTILLO"],
  "HUEVO": ["OVOFULL", "ARGEDIENT"],
  "LECHE": ["KTAHEALTH", "LA HERMINIA", "LA EMILIA", "REMOLAC", "COTAR", "REGINA", "VACALIN"],
  "POLVO P/HORNEAR": ["PANYMAX"],
  "SAL": ["CELUSAL"],
  "CHIA": ["ARROYO SECO", "CUMANA"],
  "STEVIA": ["TREVER", "DULRI"],
  "LINO": ["AGUARA", "ARROYO SECO"],
  "ALBUMINA DE HUEVO EN POLVO": ["OVOFULL"],
  "PROTEINA VEGETAL AISLADA DE SOJA": ["VITATECH"]
};


// =====================================
// INIT
// =====================================

window.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("usuario_logueado")) {
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  loteActual = Number(params.get("lote"));

  if (!loteActual) {
    mostrarError("Falta el número de lote.");
    return;
  }

  cargarLote(loteActual);
});


function cargarLote(lote) {
  fetch(`${URL_APPS_SCRIPT}?action=getLoteCompleto&lote=${lote}`)
    .then(res => res.json())
    .then(data => {
      if (data.status !== "ok") {
        mostrarError(data.message || "No se encontró el lote.");
        return;
      }
      datosOriginales = data;
      precargarFormulario(data);
      document.getElementById("spinner-overlay").style.display = "none";
      document.getElementById("app").style.display = "block";
    })
    .catch(() => {
      mostrarError("Error de conexión al cargar el lote.");
    });
}


function irAEditarProduccion() {
  if (!loteActual) return;
  window.location.href = `waffles.html?lote=${loteActual}&edit=1`;
}


function mostrarError(msg) {
  document.getElementById("spinner-overlay").innerHTML =
    `<div class="spinner-error">${msg}<br><br><a href="index.html" class="btn-logout" style="background:#2d6a4f;border-color:#2d6a4f;">← Volver al inicio</a></div>`;
}


// =====================================
// PRECARGA
// =====================================

function precargarFormulario(d) {
  document.getElementById("fecha").value = d.fecha || "";
  document.getElementById("lote").value = d.lote || "";
  document.getElementById("fechaVto").value = d.fechaVto || "";

  // Jarras
  let total = 0;
  Object.entries(d.jarras || {}).forEach(([sabor, cantidad]) => {
    agregarSaborSelector(sabor, cantidad);
    total += Number(cantidad);
  });
  document.getElementById("totalJarras").value = total;

  // Materias primas
  (d.materiasPrimas || []).forEach(mp => {
    agregarMateriaSelector(mp);
  });
}


// =====================================
// SABORES DINÁMICOS
// =====================================

function getSaboresSeleccionados() {
  return Array.from(document.querySelectorAll(".sabor-select"))
    .map(s => s.value).filter(v => v);
}

function agregarSaborSelector(saborPre, cantidadPre) {
  const usados = getSaboresSeleccionados();
  const disponibles = SABORES.filter(s => !usados.includes(s));

  if (!saborPre && disponibles.length === 0) {
    alert("Ya agregaste todos los sabores.");
    return;
  }

  const container = document.getElementById("sabores-container");
  const id = contadorSabor++;

  // Si es precargado, incluir el sabor actual en las opciones
  const opciones = saborPre
    ? [saborPre, ...disponibles.filter(s => s !== saborPre)]
    : disponibles;

  const div = document.createElement("div");
  div.classList.add("sabor-bloque");
  div.setAttribute("data-id", id);

  div.innerHTML = `
    <div class="sabor-row">
      <select class="sabor-select campo-input" onchange="onSaborChange(this)">
        <option value="">Seleccionar sabor</option>
        ${opciones.map(s => `<option value="${s}" ${s === saborPre ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <input type="number" class="sabor-cantidad campo-input"
             placeholder="Cant." min="0" value="${cantidadPre || 0}"
             style="${saborPre ? "" : "display:none;"}" required>
      <button type="button" class="btn-eliminar-sabor" onclick="eliminarSabor(${id})">✕</button>
    </div>
  `;

  container.appendChild(div);
}

function onSaborChange(select) {
  const input = select.nextElementSibling;
  input.style.display = select.value ? "block" : "none";
}

function eliminarSabor(id) {
  document.querySelector(`.sabor-bloque[data-id="${id}"]`)?.remove();
}


// =====================================
// MATERIAS PRIMAS DINÁMICAS
// =====================================

function getMateriasSeleccionadas() {
  return Array.from(document.querySelectorAll(".materia-select"))
    .map(s => s.value).filter(v => v);
}

function agregarMateriaSelector(mpPre) {
  const usadas = getMateriasSeleccionadas();
  const disponibles = Object.keys(materiasConfig).filter(m => !usadas.includes(m));

  if (!mpPre && disponibles.length === 0) {
    alert("Ya agregaste todas las materias primas.");
    return;
  }

  const container = document.getElementById("materias-container");
  const id = contadorMateria++;

  const opciones = mpPre
    ? [mpPre.nombre, ...disponibles.filter(m => m !== mpPre.nombre)]
    : disponibles;

  const div = document.createElement("div");
  div.classList.add("materia-bloque");
  div.setAttribute("data-id", id);

  div.innerHTML = `
    <div class="bloque-header">
      <span class="bloque-titulo">${mpPre ? mpPre.nombre : "Nueva Materia Prima"}</span>
      <button type="button" class="btn-eliminar" onclick="eliminarMateria(${id})">✕ Eliminar</button>
    </div>

    <div class="campo-grupo">
      <label class="campo-label">Materia Prima</label>
      <select class="materia-select campo-input" required onchange="renderMateria(${id}, this.value)">
        <option value="">Seleccionar</option>
        ${opciones.map(m => `<option value="${m}" ${mpPre && m === mpPre.nombre ? "selected" : ""}>${m}</option>`).join("")}
      </select>
    </div>

    <div id="materia-detalle-${id}"></div>
  `;

  container.appendChild(div);

  if (mpPre) renderMateria(id, mpPre.nombre, mpPre);
}

function eliminarMateria(id) {
  document.querySelector(`.materia-bloque[data-id="${id}"]`)?.remove();
}

function renderMateria(id, nombre, mpPre) {
  if (!nombre) return;

  const bloque = document.querySelector(`.materia-bloque[data-id="${id}"]`);
  bloque.querySelector(".bloque-titulo").textContent = nombre;

  const detalle = document.getElementById(`materia-detalle-${id}`);
  const marcas = materiasConfig[nombre];

  const marcaActual = mpPre ? mpPre.marca : "";
  const esMarcaConocida = marcas.includes(marcaActual);
  const marcaSelectValue = mpPre ? (esMarcaConocida ? marcaActual : "OTRO") : "";

  detalle.innerHTML = `
    <div class="campo-grupo">
      <label class="campo-label">Marca</label>
      <select class="campo-input" required onchange="toggleMarcaManual(this)">
        <option value="">Seleccionar</option>
        ${marcas.map(m => `<option value="${m}" ${m === marcaSelectValue ? "selected" : ""}>${m}</option>`).join("")}
        <option value="OTRO" ${marcaSelectValue === "OTRO" ? "selected" : ""}>OTRO</option>
      </select>
      <input type="text" class="campo-input" placeholder="Ingresar marca manualmente"
             value="${marcaSelectValue === "OTRO" ? marcaActual : ""}"
             style="${marcaSelectValue === "OTRO" ? "" : "display:none;"} margin-top:8px;">
    </div>

    <div class="campo-grupo">
      <label class="campo-label">Lote Proveedor</label>
      <input type="text" class="campo-input" required placeholder="Ej: L2024-001"
             value="${mpPre ? mpPre.loteProveedor : ""}">
    </div>

    <div class="campo-grupo">
      <label class="campo-label">Fecha Vencimiento MP</label>
      <input type="date" class="campo-input" required
             value="${mpPre ? mpPre.vencimiento : ""}">
    </div>

    <div class="campo-grupo">
      <label class="campo-label">¿Usa remanente lote anterior?</label>
      <select class="campo-input" required>
        <option value="">Seleccionar</option>
        <option value="SI" ${mpPre && mpPre.remanente === "SI" ? "selected" : ""}>Sí</option>
        <option value="NO" ${mpPre && mpPre.remanente === "NO" ? "selected" : ""}>No</option>
      </select>
    </div>

    <div class="campo-grupo">
      <label class="campo-label">📷 Foto del lote</label>
      ${mpPre && mpPre.linkImagen
        ? `<a href="${mpPre.linkImagen}" target="_blank" class="link-imagen-actual">📎 Ver imagen actual</a>`
        : ""}
      <input type="file" class="campo-input campo-file" accept="image/*" capture="environment">
      <input type="hidden" class="link-imagen-existente" value="${mpPre ? mpPre.linkImagen || "" : ""}">
      <span class="campo-hint">Dejá vacío para conservar la imagen actual.</span>
    </div>
  `;

  if (marcaSelectValue === "OTRO") {
    detalle.querySelector('input[type="text"].campo-input[placeholder*="manualmente"]').required = true;
  }
}

function toggleMarcaManual(select) {
  const inputManual = select.nextElementSibling;
  if (select.value === "OTRO") {
    inputManual.style.display = "block";
    inputManual.required = true;
  } else {
    inputManual.style.display = "none";
    inputManual.required = false;
    inputManual.value = "";
  }
}


// =====================================
// COMPRIMIR IMAGEN
// =====================================

function comprimirImagen(file, maxWidth, quality, callback) {
  if (!file) return callback("");

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      let width  = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width  = maxWidth;
      }
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}


// =====================================
// SUBMIT
// =====================================

document.getElementById("formEditar").addEventListener("submit", function(e) {
  e.preventDefault();

  const fechaStr = document.getElementById("fecha").value;
  const fechaVto = document.getElementById("fechaVto").value;
  const lote = Number(document.getElementById("lote").value);

  const jarras = {};
  let suma = 0;
  document.querySelectorAll(".sabor-bloque").forEach(bloque => {
    const sabor = bloque.querySelector(".sabor-select").value;
    const cantidad = Number(bloque.querySelector(".sabor-cantidad").value);
    if (!sabor) return;
    jarras[sabor] = cantidad;
    suma += cantidad;
  });

  if (Object.keys(jarras).length === 0) {
    alert("Debés tener al menos un sabor.");
    return;
  }

  const totalIngresado = Number(document.getElementById("totalJarras").value);
  if (suma !== totalIngresado) {
    alert(`El total (${totalIngresado}) no coincide con la suma por variedad (${suma}).`);
    return;
  }

  const bloques = document.querySelectorAll(".materia-bloque");

  const procesarMaterias = (callback) => {
    if (bloques.length === 0) return callback([]);

    const materias = [];
    let procesadas = 0;

    bloques.forEach(bloque => {
      const nombre = bloque.querySelector(".materia-select").value;
      const selects = bloque.querySelectorAll("select");
      const inputs = bloque.querySelectorAll("input");
      const fileInput = bloque.querySelector('input[type="file"]');
      const linkExistente = bloque.querySelector(".link-imagen-existente")?.value || "";
      const file = fileInput?.files[0];

      const procesar = (base64) => {
        const marcaSeleccionada = selects[1].value;
        const marcaFinal = marcaSeleccionada === "OTRO" ? inputs[0].value : marcaSeleccionada;

        materias.push({
          nombre,
          marca: marcaFinal,
          loteProveedor: inputs[1].value,
          vencimiento: inputs[2].value,
          remanente: selects[2].value,
          imagenBase64: base64,
          linkImagen: linkExistente
        });

        procesadas++;
        if (procesadas === bloques.length) callback(materias);
      };

      if (file) {
        comprimirImagen(file, 800, 0.7, procesar);
      } else {
        procesar("");
      }
    });
  };

  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Guardando...";

  procesarMaterias(materias => {
    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      body: JSON.stringify({
        action: "editarLote",
        usuario: sessionStorage.getItem("usuario_logueado") || "",
        fecha: fechaStr,
        lote,
        materiasPrimas: materias,
        jarras,
        fechaVto: fechaVto ? new Date(fechaVto).toISOString() : ""
      })
    })
      .then(res => res.json())
      .then(resp => {
        if (resp.status === "error") {
          alert("Error: " + resp.message);
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Guardar cambios";
          return;
        }
        document.getElementById("modal-exito").style.display = "flex";
      })
      .catch(() => {
        alert("Error de conexión al guardar.");
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Guardar cambios";
      });
  });
});
