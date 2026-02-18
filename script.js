const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzangnXSNaSdi-oMkIvLjjUDjA10XvCSzcAJZq1jIXjVhbMe4m0IHmuAZ7pSQEMJ3O3/exec";

let ultimoLoteBackend = 0;
let contadorMateria = 0;


// =====================================
// CONFIG MATERIAS + MARCAS
// =====================================

const materiasConfig = {
  "AVENA": ["AGROINDISTRIA TRES ARROYOS","ARROYO SECO DISTRIDIET","INDUSTRIAS DE AVENA"],
  "BANANA": ["VERDULERIA"],
  "CACAO DARK": ["BARRY CALLEBAUT","FENIX"],
  "CACAO RED": ["FENIX","BARRY CALLEBAUT"],
  "COCO": ["CUMAN/BAVOSI","LODISER","MELAR"],
  "EXTRACTO": ["ESPECIAS EL CASTILLO"],
  "HUEVO": ["OVOFULL","ARGEDIENT"],
  "LECHE": ["KTAHEALTH","LA HERMINIA","LA EMILIA","REMOLAC","COTAR","REGINA","VACALIN"],
  "POLVO P/HORNEAR": ["PANYMAX"],
  "SAL": ["CELUSAL"],
  "CHIA": ["ARROYO SECO","CUMANA"],
  "STEVIA": ["TREVER","DULRI"],
  "LINO": ["AGUARA","ARROYO SECO"],
  "ALBUMINA DE HUEVO EN POLVO": ["OVOFULL"],
  "PROTEINA VEGETAL AISLADA DE SOJA": ["VITATECH"]
};


// =====================================
// GET ULTIMO LOTE AL CARGAR
// =====================================

window.addEventListener("DOMContentLoaded", () => {

  fetch(URL_APPS_SCRIPT)
    .then(res => res.json())
    .then(data => {
      ultimoLoteBackend = data.ultimoLote || 0;
      ultimaFecha = `${new Date(data.ultimaFecha).getDate()}/${new Date(data.ultimaFecha).getMonth()+1}/${new Date(data.ultimaFecha).getFullYear()}` || 0;
      console.log("Último lote:", ultimoLoteBackend, " cocinado el día ", ultimaFecha);    });

});


// =====================================
// AGREGAR MATERIA
// =====================================

function agregarMateriaSelector() {

  const container = document.getElementById("materias-container");
  const id = contadorMateria++;

  const div = document.createElement("div");
  div.classList.add("materia-bloque");
  div.setAttribute("data-id", id);

  div.innerHTML = `
    <button type="button" onclick="eliminarMateria(${id})">Eliminar</button>
    <br><br>

    <label>Materia Prima:</label>
    <select class="materia-select" required onchange="renderMateria(${id}, this.value)">
      <option value="">Seleccionar</option>
      ${Object.keys(materiasConfig).map(m => `<option value="${m}">${m}</option>`).join("")}
    </select>

    <div id="materia-detalle-${id}"></div>
  `;

  container.appendChild(div);
}

function eliminarMateria(id) {
  const bloque = document.querySelector(`[data-id="${id}"]`);
  if (bloque) bloque.remove();
}


// =====================================
// RENDER DETALLE MATERIA
// =====================================

function renderMateria(id, nombre) {

  if (!nombre) return;

  const detalle = document.getElementById(`materia-detalle-${id}`);
  const marcas = materiasConfig[nombre];

  detalle.innerHTML = `
    <label>Marca:</label>
    <select required onchange="toggleMarcaManual(this)">
      <option value="">Seleccionar</option>
      ${marcas.map(m => `<option value="${m}">${m}</option>`).join("")}
      <option value="OTRO">OTRO</option>
    </select>

    <input type="text" placeholder="Ingresar marca" style="display:none;" required>

    <br>

    <label>Lote proveedor:</label>
    <input type="text" required>

    <label>Fecha vencimiento MP:</label>
    <input type="date" required>

    <br>

    <label>Usa remanente lote anterior?</label>
    <select required>
      <option value="">Seleccionar</option>
      <option value="SI">Sí</option>
      <option value="NO">No</option>
    </select>

    <br>

    <label>Foto del lote:</label>
    <input type="file" accept="image/*" capture="environment" required>
  `;
}

function toggleMarcaManual(select) {
  const inputManual = select.nextElementSibling;

  if (select.value === "OTRO") {
    inputManual.style.display = "inline-block";
    inputManual.required = true;
  } else {
    inputManual.style.display = "none";
    inputManual.required = false;
    inputManual.value = "";
  }
}


// =====================================
// SUMAR MESES AJUSTANDO DIA
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

document.getElementById("formLote").addEventListener("submit", function(e) {

  e.preventDefault();

  const fecha = document.getElementById("fecha").value;
  const lote = Number(document.getElementById("lote").value);

  if (lote <= ultimoLoteBackend) {
    alert(`El lote debe ser mayor a ${ultimoLoteBackend}`);
    return;
  }

  // VALIDACION JARRAS
  const sabores = ["AV","CH","BA","CO","CB","AM","SA","VAV"];
  let suma = 0;
  const jarras = {};

  sabores.forEach(s => {
    const valor = Number(document.getElementById(s).value);
    suma += valor;
    jarras[s] = valor;
  });

  const totalIngresado = Number(document.getElementById("totalJarras").value);

  if (suma !== totalIngresado) {
    alert("El total de jarras no coincide con la suma por variedad.");
    return;
  }

  // CALCULO BANANA
  const gramosBanana =
    (jarras["BA"] * 250) +
    (jarras["CO"] * 200) +
    (jarras["CB"] * 200);

  const kgBanana = (gramosBanana / 1000).toFixed(2);
  const fechaVto = sumarMesesAjustado(fecha, 7);

  alert(
    `Se necesitarán ${kgBanana} kg de banana.\n\n` +
    `Vencimiento del lote: ${fechaVto.toLocaleDateString()}`
  );

  // RECOLECCION MATERIAS
  const materias = [];
  const bloques = document.querySelectorAll(".materia-bloque");

  let procesadas = 0;

  bloques.forEach(bloque => {

    const nombre = bloque.querySelector(".materia-select").value;
    const selects = bloque.querySelectorAll("select");
    const inputs = bloque.querySelectorAll("input");
    const file = bloque.querySelector('input[type="file"]').files[0];

    const reader = new FileReader();

    reader.onload = function(event) {

      const marcaSeleccionada = selects[1].value;
      const marcaFinal = marcaSeleccionada === "OTRO"
        ? inputs[0].value
        : marcaSeleccionada;

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
// ENVIO
// =====================================

function enviarDatos(fecha, lote, materias, jarras) {

  fetch(URL_APPS_SCRIPT, {
    method: "POST",
    body: JSON.stringify({
      fecha,
      lote,
      materiasPrimas: materias,
      jarras
    })
  })
  .then(res => res.json())
  .then(response => {
    if (response.status === "error") {
      console.error(response.message);
      alert("Error backend: " + response.message);
      return;
    }

    alert("Lote guardado correctamente");
    location.reload();
  })
  .catch(() => alert("Error al guardar"));

}
