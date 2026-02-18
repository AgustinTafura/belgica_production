const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzDoSkNB4UGKJogPfUdSH3kUl14ZSFeovpgik8qKUuCn_cTKiBPnxpe-OVNfqtq0rmW/exec";

let ultimoLoteBackend = 0;
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
  fetch(URL_APPS_SCRIPT)
    .then(res => res.json())
    .then(data => {
      ultimoLoteBackend = data.ultimoLote || 0;

      const fechaObj = new Date(data.ultimaFecha);
      const ultimaFechaStr = `${fechaObj.getDate()}/${fechaObj.getMonth() + 1}/${fechaObj.getFullYear()}`;

      document.getElementById("info-ultimo-lote").innerHTML =
        `<span class="badge-info">Último lote registrado: <strong>#${ultimoLoteBackend}</strong> — cocinado el <strong>${ultimaFechaStr}</strong></span>`;

      document.getElementById("spinner-overlay").style.display = "none";
      document.getElementById("app").style.display = "block";
    })
    .catch(() => {
      document.getElementById("spinner-overlay").innerHTML =
        `<div class="spinner-error">Error al conectar. Recargá la página.</div>`;
    });
});


// =====================================
// SABORES DINÁMICOS
// =====================================

function getSaboresSeleccionados() {
  return Array.from(document.querySelectorAll(".sabor-select"))
    .map(s => s.value).filter(v => v);
}

function agregarSaborSelector() {
  const disponibles = SABORES.filter(s => !getSaboresSeleccionados().includes(s));

  if (disponibles.length === 0) {
    alert("Ya agregaste todos los sabores disponibles.");
    return;
  }

  const container = document.getElementById("sabores-container");
  const id = contadorSabor++;

  const div = document.createElement("div");
  div.classList.add("sabor-bloque");
  div.setAttribute("data-id", id);

  div.innerHTML = `
    <div class="sabor-row">
      <select class="sabor-select campo-input" onchange="onSaborChange(this)">
        <option value="">Seleccionar sabor</option>
        ${disponibles.map(s => `<option value="${s}">${s}</option>`).join("")}
      </select>
      <input type="number" class="sabor-cantidad campo-input" placeholder="Cant." min="0" value="0" style="display:none;" required>
      <button type="button" class="btn-eliminar-sabor" onclick="eliminarSabor(${id})">✕</button>
    </div>
  `;

  container.appendChild(div);
}

function onSaborChange(select) {
  const input = select.nextElementSibling;
  if (select.value) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
  }
}

function eliminarSabor(id) {
  const bloque = document.querySelector(`.sabor-bloque[data-id="${id}"]`);
  if (bloque) bloque.remove();
}


// =====================================
// MATERIAS PRIMAS DINÁMICAS
// =====================================

function getMateriasSeleccionadas() {
  return Array.from(document.querySelectorAll(".materia-select"))
    .map(s => s.value).filter(v => v);
}

function agregarMateriaSelector() {
  const usadas = getMateriasSeleccionadas();
  const disponibles = Object.keys(materiasConfig).filter(m => !usadas.includes(m));

  if (disponibles.length === 0) {
    alert("Ya agregaste todas las materias primas disponibles.");
    return;
  }

  const container = document.getElementById("materias-container");
  const id = contadorMateria++;

  const div = document.createElement("div");
  div.classList.add("materia-bloque");
  div.setAttribute("data-id", id);

  div.innerHTML = `
    <div class="bloque-header">
      <span class="bloque-titulo">Nueva Materia Prima</span>
      <button type="button" class="btn-eliminar" onclick="eliminarMateria(${id})">✕ Eliminar</button>
    </div>

    <div class="campo-grupo">
      <label class="campo-label">Materia Prima</label>
      <select class="materia-select campo-input" required onchange="renderMateria(${id}, this.value)">
        <option value="">Seleccionar</option>
        ${disponibles.map(m => `<option value="${m}">${m}</option>`).join("")}
      </select>
    </div>

    <div id="materia-detalle-${id}"></div>
  `;

  container.appendChild(div);
}

function eliminarMateria(id) {
  const bloque = document.querySelector(`.materia-bloque[data-id="${id}"]`);
  if (bloque) bloque.remove();
}

function renderMateria(id, nombre) {
  if (!nombre) return;

  const bloque = document.querySelector(`.materia-bloque[data-id="${id}"]`);
  const titulo = bloque.querySelector(".bloque-titulo");
  if (titulo) titulo.textContent = nombre;

  const detalle = document.getElementById(`materia-detalle-${id}`);
  const marcas = materiasConfig[nombre];

  detalle.innerHTML = `
    <div class="campo-grupo">
      <label class="campo-label">Marca</label>
      <select class="campo-input" required onchange="toggleMarcaManual(this)">
        <option value="">Seleccionar</option>
        ${marcas.map(m => `<option value="${m}">${m}</option>`).join("")}
        <option value="OTRO">OTRO</option>
      </select>
      <input type="text" class="campo-input" placeholder="Ingresar marca manualmente" style="display:none; margin-top:8px;" required>
    </div>

    <div class="campo-grupo">
      <label class="campo-label">Lote Proveedor</label>
      <input type="text" class="campo-input" required placeholder="Ej: L2024-001">
    </div>

    <div class="campo-grupo">
      <label class="campo-label">Fecha Vencimiento MP</label>
      <input type="date" class="campo-input" required>
    </div>

    <div class="campo-grupo">
      <label class="campo-label">¿Usa remanente lote anterior?</label>
      <select class="campo-input" required>
        <option value="">Seleccionar</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </div>

    <div class="campo-grupo">
      <label class="campo-label">📷 Foto del lote</label>
      <input type="file" class="campo-input campo-file" accept="image/*" capture="environment" required>
    </div>
  `;
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
// SUMAR MESES
// =====================================

function sumarMesesAjustado(fechaStr, meses) {
  const fecha = new Date(fechaStr);
  const diaOriginal = fecha.getDate();
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);
  if (nuevaFecha.getDate() !== diaOriginal) {
    nuevaFecha.setDate(0);
  }
  return nuevaFecha;
}


// =====================================
// SUBMIT
// =====================================

document.getElementById("formLote").addEventListener("submit", function (e) {
  e.preventDefault();

  const fecha = document.getElementById("fecha").value;
  const lote = Number(document.getElementById("lote").value);

  if (lote <= ultimoLoteBackend) {
    alert(`El lote debe ser mayor a ${ultimoLoteBackend}`);
    return;
  }

  // Recolectar jarras dinámicas
  const jarras = {};
  let suma = 0;
  let saboresValidos = true;

  document.querySelectorAll(".sabor-bloque").forEach(bloque => {
    const sabor = bloque.querySelector(".sabor-select").value;
    const cantidadInput = bloque.querySelector(".sabor-cantidad");
    const cantidad = Number(cantidadInput.value);

    if (!sabor) {
      saborValidos = false;
      return;
    }
    jarras[sabor] = cantidad;
    suma += cantidad;
  });

  if (Object.keys(jarras).length === 0) {
    alert("Debés agregar al menos un sabor.");
    return;
  }

  const totalIngresado = Number(document.getElementById("totalJarras").value);
  if (suma !== totalIngresado) {
    alert(`El total ingresado (${totalIngresado}) no coincide con la suma por variedad (${suma}).`);
    return;
  }

  // Cálculo banana
  const gramosBanana =
    ((jarras["BA"] || 0) * 250) +
    ((jarras["CO"] || 0) * 200) +
    ((jarras["CB"] || 0) * 200);
  const kgBanana = (gramosBanana / 1000).toFixed(2);
  const fechaVto = sumarMesesAjustado(fecha, 7);

  alert(
    `Se necesitarán ${kgBanana} kg de banana.\n\nVencimiento del lote: ${fechaVto.toLocaleDateString()}`
  );

  // Recolectar materias
  const bloques = document.querySelectorAll(".materia-bloque");

  if (bloques.length === 0) {
    enviarDatos(fecha, lote, [], jarras);
    return;
  }

  const materias = [];
  let procesadas = 0;

  bloques.forEach(bloque => {
    const nombre = bloque.querySelector(".materia-select").value;
    const selects = bloque.querySelectorAll("select");
    const inputs = bloque.querySelectorAll("input");
    const file = bloque.querySelector('input[type="file"]').files[0];

    const reader = new FileReader();

    reader.onload = function (event) {
      const marcaSeleccionada = selects[1].value;
      const marcaFinal = marcaSeleccionada === "OTRO" ? inputs[0].value : marcaSeleccionada;

      materias.push({
        nombre,
        marca: marcaFinal,
        loteProveedor: inputs[1].value,
        vencimiento: inputs[2].value,
        remanente: selects[2].value,
        imagenBase64: event.target.result
      });

      procesadas++;
      if (procesadas === bloques.length) {
        enviarDatos(fecha, lote, materias, jarras);
      }
    };

    reader.readAsDataURL(file);
  });
});


// =====================================
// ENVÍO
// =====================================

function enviarDatos(fecha, lote, materias, jarras) {
  const btnSubmit = document.getElementById("btn-submit");
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Guardando...";

  fetch(URL_APPS_SCRIPT, {
    method: "POST",
    body: JSON.stringify({ fecha, lote, materiasPrimas: materias, jarras })
  })
    .then(res => res.json())
    .then(response => {
      if (response.status === "error") {
        console.error(response.message);
        alert("Error backend: " + response.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Guardar Lote";
        return;
      }
      alert("✅ Lote guardado correctamente");
      location.reload();
    })
    .catch(() => {
      alert("Error al guardar. Intentá de nuevo.");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Guardar Lote";
    });
}