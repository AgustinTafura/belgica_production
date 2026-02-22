const URL_APPS_SCRIPT = CONFIG.URL_APPS_SCRIPT;

let ultimoLoteBackend = 0;
let ultimaFechaBackend = "";
let contadorMateria = 0;
let contadorSabor = 0;
let pendingData = null; // guarda datos del form hasta confirmar modal

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

// Para limitar la fecha mínima a hoy
const hoy = new Date();
const yyyy = hoy.getFullYear();
const mm = String(hoy.getMonth() + 1).padStart(2, '0');
const dd = String(hoy.getDate()).padStart(2, '0');
const hoyStr = `${yyyy}-${mm}-${dd}`;

// =====================================
// INIT
// =====================================

window.addEventListener("DOMContentLoaded", () => {
  const sesionActiva = sessionStorage.getItem("usuario_logueado");
  if (sesionActiva) {
    cargarDatosIniciales();
  } else {
    document.getElementById("spinner-overlay").style.display = "none";
    document.getElementById("login-screen").style.display = "block";
  }
});


// =====================================
// LOGIN
// =====================================

function handleLogin() {
  const usuario = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value.trim();
  const btnLogin = document.getElementById("btn-login");
  const errorDiv = document.getElementById("login-error");

  if (!usuario || !password) {
    mostrarErrorLogin("Completá usuario y contraseña.");
    return;
  }

  errorDiv.style.display = "none";
  btnLogin.disabled = true;
  btnLogin.textContent = "Verificando...";

  fetch(URL_APPS_SCRIPT, {
    method: "POST",
    body: JSON.stringify({ action: "login", usuario, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "ok") {
        sessionStorage.setItem("usuario_logueado", usuario);
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("spinner-overlay").style.display = "flex";
        cargarDatosIniciales();
      } else {
        mostrarErrorLogin("Usuario o contraseña incorrectos.");
        btnLogin.disabled = false;
        btnLogin.textContent = "Ingresar";
      }
    })
    .catch(() => {
      mostrarErrorLogin("Error de conexión. Intentá de nuevo.");
      btnLogin.disabled = false;
      btnLogin.textContent = "Ingresar";
    });
}

function mostrarErrorLogin(msg) {
  const errorDiv = document.getElementById("login-error");
  errorDiv.textContent = msg;
  errorDiv.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const passInput = document.getElementById("login-pass");
  if (passInput) {
    passInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleLogin();
    });
  }
});

function handleLogout() {
  sessionStorage.removeItem("usuario_logueado");
  location.reload();
}


// =====================================
// CARGA INICIAL
// =====================================

function cargarDatosIniciales() {
  // limiar fecha mínima para hoy
  document.getElementById("fecha").min = hoyStr;

  fetch(URL_APPS_SCRIPT)
    .then(res => res.json())
    .then(data => {
      console.log("Datos iniciales:", data);
      ultimoLoteBackend = data.ultimoLote || 0;

      const fechaObj = new Date(data.ultimaFecha);
      ultimaFechaBackend = data.ultimaFecha;
      const ultimaFechaStr = `${fechaObj.getDate()}/${fechaObj.getMonth() + 1}/${fechaObj.getFullYear()}`;

      document.getElementById("info-ultimo-lote").innerHTML =
        `<span class="badge-info">Último lote: <strong>#${ultimoLoteBackend}</strong> — cocinado el <strong>${ultimaFechaStr}</strong></span>`;

      document.getElementById("spinner-overlay").style.display = "none";
      document.getElementById("app").style.display = "block";
    })
    .catch(() => {
      document.getElementById("spinner-overlay").innerHTML =
        `<div class="spinner-error">Error al conectar. Recargá la página.</div>`;
    });
}


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
    alert("Ya agregaste todos los sabores.");
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
      <input type="number" class="sabor-cantidad campo-input"
             placeholder="Cant." min="0" value="0" style="display:none;" required>
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

function agregarMateriaSelector() {
  const usadas = getMateriasSeleccionadas();
  const disponibles = Object.keys(materiasConfig).filter(m => !usadas.includes(m));

  if (disponibles.length === 0) {
    alert("Ya agregaste todas las materias primas.");
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
  document.querySelector(`.materia-bloque[data-id="${id}"]`)?.remove();
}

function renderMateria(id, nombre) {
  if (!nombre) return;

  const bloque = document.querySelector(`.materia-bloque[data-id="${id}"]`);
  bloque.querySelector(".bloque-titulo").textContent = nombre;

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
      <input type="text" class="campo-input" placeholder="Ingresar marca manualmente"
             style="display:none; margin-top:8px;">
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

  const inputFecha = detalle.querySelector('input[type="date"].campo-input');
  inputFecha.min = hoyStr;

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
  if (nuevaFecha.getDate() !== diaOriginal) nuevaFecha.setDate(0);
  return nuevaFecha;
}


// =====================================
// MODAL PRODUCCIÓN
// =====================================

function mostrarModalProduccion(kgBanana, fechaVto) {
  document.getElementById("modal-banana").textContent = `${(kgBanana / 0.6).toFixed(2)} kg`;
  document.getElementById("modal-vencimiento").textContent = fechaVto.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  document.getElementById("modal-produccion").style.display = "flex";
}

function cerrarModalYEnviar() {
  document.getElementById("modal-produccion").style.display = "none";

  if (!pendingData) return;

  const { fecha, lote, materias, jarras } = pendingData;
  enviarDatos(fecha, lote, materias, jarras);
}


// =====================================
// MODAL ÉXITO → IR A WAFFLES
// =====================================

function mostrarModalExito(fecha, lote, jarras) {
  document.getElementById("modal-exito").style.display = "flex";

  // Guardamos en sessionStorage para pasarlos a waffles.html
  sessionStorage.setItem("waffle_fecha", fecha);
  sessionStorage.setItem("waffle_lote", lote);
  sessionStorage.setItem("waffle_jarras", JSON.stringify(jarras));
}

function irAWaffles() {
  const fecha  = sessionStorage.getItem("waffle_fecha");
  const lote   = sessionStorage.getItem("waffle_lote");
  const jarras = sessionStorage.getItem("waffle_jarras");

  const params = new URLSearchParams({ fecha, lote, jarras });
  window.location.href = `waffles.html?${params.toString()}`;
}


// =====================================
// SUBMIT
// =====================================

document.getElementById("formLote").addEventListener("submit", function (e) {
  e.preventDefault();

  const fechaStr = document.getElementById("fecha").value;

  const [anio, mes, dia] = fechaStr.split("-").map(Number);

  // Esto crea la fecha en hora LOCAL (Argentina)
  const fecha = new Date(anio, mes - 1, dia);

  const lote = Number(document.getElementById("lote").value);

  if (lote <= ultimoLoteBackend) {
    alert(`El lote debe ser mayor a ${ultimoLoteBackend}`);
    return;
  }

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
    alert("Debés agregar al menos un sabor.");
    return;
  }

  const totalIngresado = Number(document.getElementById("totalJarras").value);
  if (suma !== totalIngresado) {
    alert(`El total (${totalIngresado}) no coincide con la suma por variedad (${suma}).`);
    return;
  }

  const gramosBanana =
    ((jarras["BA"] || 0) * 250) +
    ((jarras["CO"] || 0) * 200) +
    ((jarras["CB"] || 0) * 200);
  const kgBanana = (gramosBanana / 1000);
  const fechaVto = sumarMesesAjustado(fecha, 7);

  // Recolectar materias y guardar todo en pendingData
  const bloques = document.querySelectorAll(".materia-bloque");

  const procesarMaterias = (callback) => {
    if (bloques.length === 0) return callback([]);

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
        if (procesadas === bloques.length) callback(materias);
      };
      reader.readAsDataURL(file);
    });
  };

  procesarMaterias((materias) => {
    pendingData = { fecha, lote, materias, jarras };
    mostrarModalProduccion(kgBanana, fechaVto);
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
    body: JSON.stringify({ action: "guardar", fecha, lote, materiasPrimas: materias, jarras })
  })
    .then(res => res.json())
    .then(response => {
      if (response.status === "error") {
        alert("Error: " + response.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Guardar Lote";
        pendingData = null;
        return;
      }
      mostrarModalExito(fecha, lote, jarras);
    })
    .catch(() => {
      alert("Error al guardar. Intentá de nuevo.");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Guardar Lote";
      pendingData = null;
    });
}