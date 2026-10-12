/* ==========================================================
   Asesoría Archivística — interacción
   Sin librerías: solo transformaciones CSS y requestAnimationFrame.
   ========================================================== */
(function () {
  "use strict";

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var puntero = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function limitar(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function suave(t) { return t * t * (3 - 2 * t); }
  function tramo(p, a, b) { return limitar((p - a) / (b - a), 0, 1); }
  function mezcla(a, b, t) { return a + (b - a) * t; }

  /* ---------------------------------------------------------
     1. Formularios → Mailerlite → gracias.html
     --------------------------------------------------------- */
  document.querySelectorAll(".form-ml").forEach(function (form) {
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var boton = form.querySelector("button[type=submit]");
      var error = form.querySelector(".mensaje-error");
      var trampa = form.querySelector('input[name="website"]');
      if (trampa && trampa.value) { return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var datos = new FormData(form);
      datos.delete("website");
      boton.disabled = true;
      var textoOriginal = boton.textContent;
      boton.textContent = "Enviando…";
      if (error) { error.classList.remove("visible"); }

      // "no-cors": la respuesta no es legible, pero la solicitud llega. El doble opt-in confirma.
      fetch(form.action, { method: "POST", body: datos, mode: "no-cors" })
        .then(function () { window.location.href = "gracias.html"; })
        .catch(function () {
          boton.disabled = false;
          boton.textContent = textoOriginal;
          if (error) { error.classList.add("visible"); }
        });
    });
  });

  /* ---------------------------------------------------------
     2. Pila documental del hero: inclinación con el puntero
        y apertura de las hojas al hacer scroll
     --------------------------------------------------------- */
  var pila = document.querySelector(".pila");
  var escenaPila = document.querySelector(".pila__escena");
  var abrePorPuntero = 0;

  if (pila && escenaPila && !reducido) {
    if (puntero) {
      window.addEventListener("pointermove", function (e) {
        if (window.scrollY > window.innerHeight) { return; }
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        escenaPila.style.setProperty("--rx", (nx * 18).toFixed(2) + "deg");
        escenaPila.style.setProperty("--ry", (-ny * 14).toFixed(2) + "deg");
      }, { passive: true });
      pila.addEventListener("pointerenter", function () { abrePorPuntero = 1.4; pedirCuadro(); });
      pila.addEventListener("pointerleave", function () { abrePorPuntero = 0; pedirCuadro(); });
    }
  }

  /* ---------------------------------------------------------
     3. Ciclo vital: escena 3D guiada por el scroll
     --------------------------------------------------------- */
  var DOCS = [
    { c: "100-02", t: "Acta de asamblea", col: 0, conserva: true },
    { c: "100-05", t: "Escritura de constitución", col: 0, conserva: true },
    { c: "100-11", t: "Cotización", col: 0, conserva: false },
    { c: "100-18", t: "Correspondencia informativa", col: 0, conserva: false },
    { c: "200-07", t: "Historia laboral", col: 1, conserva: true },
    { c: "200-10", t: "Nómina", col: 1, conserva: true },
    { c: "200-15", t: "Hoja de vida no seleccionada", col: 1, conserva: false },
    { c: "200-21", t: "Planilla de turnos", col: 1, conserva: false },
    { c: "300-14", t: "Libro mayor", col: 2, conserva: true },
    { c: "300-09", t: "Comprobante de egreso", col: 2, conserva: false },
    { c: "300-11", t: "Factura de proveedor", col: 2, conserva: false },
    { c: "300-03", t: "Conciliación bancaria", col: 2, conserva: false }
  ];

  var ciclo = document.querySelector(".ciclo");
  var escena = document.querySelector(".ciclo__escena");
  var mundo = document.querySelector(".ciclo__mundo");
  var caja = document.querySelector(".ciclo__caja");
  var pasos = document.querySelectorAll(".ciclo__paso");
  var textos = document.querySelectorAll(".ciclo__texto");
  var ayuda = document.querySelector(".ciclo__ayuda");
  var etiquetas = {};
  document.querySelectorAll(".ciclo__etiqueta").forEach(function (el) { etiquetas[el.dataset.etiqueta] = el; });

  var tarjetas = [];
  var poses = null;      // posiciones calculadas para cada etapa
  var etapaActual = -1;
  var mundoRot = { x: 0, y: 0 };

  // Generador pseudoaleatorio con semilla: el "desorden" es siempre el mismo.
  function azar(semilla) {
    return function () {
      semilla = (semilla * 16807) % 2147483647;
      return (semilla - 1) / 2147483646;
    };
  }

  if (ciclo && mundo) {
    DOCS.forEach(function (d) {
      var el = document.createElement("div");
      el.className = "doc";
      el.innerHTML = '<span class="doc__codigo">' + d.c + '</span><span class="doc__titulo">' + d.t + "</span>";
      mundo.appendChild(el);
      tarjetas.push(el);
    });
  }

  function calcularPoses() {
    if (!escena) { return; }
    var W = escena.clientWidth;
    var H = escena.clientHeight;
    var dw = W >= 900 ? 150 : W >= 560 ? 122 : Math.min(100, H * 0.2);
    var dh = dw * 1.3;
    var fs = (dw / 150) * 16;
    mundo.style.setProperty("--dw", dw + "px");
    tarjetas.forEach(function (el) { el.style.fontSize = fs + "px"; });

    var r = azar(4091);
    var sepCol = Math.min(W * 0.31, dw * 1.28);
    var paso = dh * 0.34;
    var altoPila = dh + 3 * paso;
    var y0 = -altoPila / 2 + dh / 2 + dh * 0.12;

    var conservados = [], eliminados = [];
    DOCS.forEach(function (d, i) { (d.conserva ? conservados : eliminados).push(i); });

    var xCons = -Math.min(W * 0.25, dw * 1.15);
    var xElim = Math.min(W * 0.25, dw * 1.15);
    var pasoCons = dh * 0.2;
    var altoCons = dh + (conservados.length - 1) * pasoCons;
    var yCons0 = -altoCons / 2 + dh / 2 + dh * 0.15;

    var porColumna = [0, 0, 0];
    var lista = DOCS.map(function (d, i) {
      // Etapa 0: acumulación, desorden en 3D
      var caos = {
        x: (r() - 0.5) * W * 0.82, y: (r() - 0.5) * H * 0.7, z: (r() - 0.5) * 340,
        rx: (r() - 0.5) * 60, ry: (r() - 0.5) * 70, rz: (r() - 0.5) * 90, s: 1, o: 1
      };
      // Etapa 1: clasificación en tres series
      var j = porColumna[d.col]++;
      var clase = { x: (d.col - 1) * sepCol, y: y0 + j * paso, z: j * 12, rx: 0, ry: 0, rz: 0, s: 1, o: 1 };
      // Etapa 2: disposición final
      var disp;
      if (d.conserva) {
        var k = conservados.indexOf(i);
        disp = { x: xCons + (k % 2 ? 6 : -6), y: yCons0 + k * pasoCons, z: 20 + k * 12, rx: 0, ry: 0, rz: k % 2 ? 1.5 : -1.5, s: 1, o: 1 };
      } else {
        var m = eliminados.indexOf(i);
        disp = {
          x: xElim + (r() - 0.5) * dw * 0.9, y: (r() - 0.5) * dh * 1.2 + dh * 0.25, z: -120 - m * 10,
          rx: 30, ry: (r() - 0.5) * 30, rz: (r() - 0.5) * 50, s: 0.72, o: 0.2
        };
      }
      return [caos, clase, disp];
    });

    poses = {
      docs: lista,
      etiquetas: {
        "col-0": { x: -sepCol, y: y0 - dh / 2 - 26 },
        "col-1": { x: 0, y: y0 - dh / 2 - 26 },
        "col-2": { x: sepCol, y: y0 - dh / 2 - 26 },
        conserva: { x: xCons, y: yCons0 - dh / 2 - 30 },
        elimina: { x: xElim, y: yCons0 - dh / 2 - 30 }
      },
      caja: { x: xCons, y: yCons0 - dh / 2 + altoCons / 2, w: dw + 44, h: altoCons + 40 }
    };

    caja.style.width = poses.caja.w + "px";
    caja.style.height = poses.caja.h + "px";
    caja.style.marginLeft = -poses.caja.w / 2 + "px";
    caja.style.marginTop = -poses.caja.h / 2 + "px";
  }

  function pintarCiclo() {
    if (!poses) { return; }
    var p;
    if (reducido) {
      p = 0.5;
    } else {
      var rect = ciclo.getBoundingClientRect();
      var recorrido = rect.height - window.innerHeight;
      p = limitar(-rect.top / recorrido, 0, 1);
    }

    var t1 = suave(tramo(p, 0.1, 0.42));
    var t2 = suave(tramo(p, 0.56, 0.86));

    tarjetas.forEach(function (el, i) {
      var k = poses.docs[i];
      var v = {};
      ["x", "y", "z", "rx", "ry", "rz", "s", "o"].forEach(function (c) {
        v[c] = mezcla(mezcla(k[0][c], k[1][c], t1), k[2][c], t2);
      });
      el.style.transform =
        "translate3d(" + v.x.toFixed(1) + "px," + v.y.toFixed(1) + "px," + v.z.toFixed(1) + "px)" +
        " rotateX(" + v.rx.toFixed(1) + "deg) rotateY(" + v.ry.toFixed(1) + "deg) rotateZ(" + v.rz.toFixed(1) + "deg)" +
        " scale(" + v.s.toFixed(3) + ")";
      el.style.opacity = v.o.toFixed(2);
      el.classList.toggle("conserva", DOCS[i].conserva && t2 > 0.65);
    });

    Object.keys(etiquetas).forEach(function (clave) {
      var el = etiquetas[clave];
      var pos = poses.etiquetas[clave];
      var o = clave.indexOf("col") === 0 ? t1 * (1 - t2) : t2;
      el.style.opacity = o.toFixed(2);
      el.style.transform = "translate(-50%,-50%) translate3d(" + pos.x + "px," + (pos.y + (1 - o) * 12) + "px,60px)";
    });

    caja.style.opacity = t2.toFixed(2);
    caja.style.transform = "translate3d(" + poses.caja.x + "px," + poses.caja.y + "px,-10px)";

    mundo.style.transform = "rotateX(" + mundoRot.x.toFixed(2) + "deg) rotateY(" + mundoRot.y.toFixed(2) + "deg)";

    var etapa = reducido ? -1 : (p < 0.27 ? 0 : p < 0.71 ? 1 : 2);
    if (etapa !== etapaActual && etapa >= 0) {
      etapaActual = etapa;
      pasos.forEach(function (li, i) {
        li.classList.toggle("activo", i === etapa);
        li.classList.toggle("hecho", i < etapa);
      });
      textos.forEach(function (tx, i) { tx.classList.toggle("activo", i === etapa); });
    }
    if (ayuda) { ayuda.style.opacity = p > 0.8 ? 0 : 1; }
  }

  if (escena && puntero && !reducido) {
    escena.addEventListener("pointermove", function (e) {
      var b = escena.getBoundingClientRect();
      mundoRot.y = ((e.clientX - b.left) / b.width - 0.5) * 10;
      mundoRot.x = -((e.clientY - b.top) / b.height - 0.5) * 8;
      pedirCuadro();
    }, { passive: true });
    escena.addEventListener("pointerleave", function () { mundoRot.x = 0; mundoRot.y = 0; pedirCuadro(); });
  }

  /* ---------------------------------------------------------
     4. Barra de progreso y bucle de dibujo
     --------------------------------------------------------- */
  var barra = document.querySelector(".progreso__barra");
  var pendiente = false;

  function cuadro() {
    pendiente = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (barra) { barra.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ")"; }

    if (pila && !reducido) {
      var abrePorScroll = limitar(window.scrollY / (window.innerHeight * 0.6), 0, 1) * 2.2;
      pila.style.setProperty("--abre", Math.max(abrePorPuntero, abrePorScroll).toFixed(3));
    }
    if (ciclo) { pintarCiclo(); }
  }
  function pedirCuadro() {
    if (!pendiente) { pendiente = true; window.requestAnimationFrame(cuadro); }
  }

  window.addEventListener("scroll", pedirCuadro, { passive: true });
  window.addEventListener("resize", function () { calcularPoses(); pedirCuadro(); });
  calcularPoses();
  pedirCuadro();
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { calcularPoses(); pedirCuadro(); }); }

  /* ---------------------------------------------------------
     5. Diagnóstico de exposición documental
     --------------------------------------------------------- */
  var preguntas = document.querySelectorAll(".pregunta");
  var arco = document.querySelector(".medidor__arco");
  var aguja = document.querySelector(".medidor__aguja");
  var cRespondidas = document.querySelector("[data-respondidas]");
  var cNivel = document.querySelector("[data-nivel]");
  var cTexto = document.querySelector("[data-texto]");
  var cta = document.querySelector(".medidor__cta");
  var respuestas = new Array(preguntas.length);

  var NIVELES = [
    { hasta: 1, nombre: "Exposición baja", texto: "Su empresa tiene bases sólidas. Las notas técnicas le ayudarán a mantenerlas al día con la norma." },
    { hasta: 3, nombre: "Exposición moderada", texto: "Hay vacíos que pueden convertirse en un problema ante un requerimiento o una auditoría." },
    { hasta: 5, nombre: "Exposición alta", texto: "El archivo hoy no respalda a la empresa. Conviene definir criterios de retención antes de que un requerimiento lo exija." }
  ];

  function actualizarMedidor() {
    var respondidas = respuestas.filter(Boolean).length;
    var noes = respuestas.filter(function (r) { return r === "no"; }).length;
    var riesgo = noes / preguntas.length;

    arco.style.strokeDashoffset = (100 - riesgo * 100).toFixed(1);
    aguja.style.transform = "rotate(" + (-90 + riesgo * 180).toFixed(1) + "deg)";
    cRespondidas.textContent = respondidas;

    if (respondidas === 0) {
      cNivel.textContent = "Responda las preguntas";
      cTexto.textContent = "El indicador se mueve con cada respuesta.";
      cNivel.classList.remove("alto");
    } else {
      var nivel = NIVELES.filter(function (n) { return noes <= n.hasta; })[0];
      cNivel.textContent = respondidas < preguntas.length ? "Hasta ahora: " + nivel.nombre.toLowerCase() : nivel.nombre;
      cTexto.textContent = nivel.texto;
      cNivel.classList.toggle("alto", noes >= 4);
    }
    if (cta) { cta.hidden = respondidas < 3; }
  }

  preguntas.forEach(function (li, i) {
    li.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        respuestas[i] = b.dataset.valor;
        li.querySelectorAll("button").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        li.classList.add("respondida");
        actualizarMedidor();
      });
    });
  });
  if (arco) { actualizarMedidor(); }

  /* ---------------------------------------------------------
     6. Carpetas de servicios (pestañas accesibles)
     --------------------------------------------------------- */
  var pestanas = Array.prototype.slice.call(document.querySelectorAll(".pestana"));

  function abrirPestana(pestana, enfocar) {
    pestanas.forEach(function (p) {
      var activa = p === pestana;
      p.setAttribute("aria-selected", String(activa));
      p.tabIndex = activa ? 0 : -1;
      document.getElementById(p.getAttribute("aria-controls")).hidden = !activa;
    });
    if (enfocar) { pestana.focus(); }
  }

  pestanas.forEach(function (p, i) {
    p.addEventListener("click", function () { abrirPestana(p, false); });
    p.addEventListener("keydown", function (e) {
      var destino = null;
      if (e.key === "ArrowRight") { destino = pestanas[(i + 1) % pestanas.length]; }
      if (e.key === "ArrowLeft") { destino = pestanas[(i - 1 + pestanas.length) % pestanas.length]; }
      if (e.key === "Home") { destino = pestanas[0]; }
      if (e.key === "End") { destino = pestanas[pestanas.length - 1]; }
      if (destino) { e.preventDefault(); abrirPestana(destino, true); }
    });
  });
})();
