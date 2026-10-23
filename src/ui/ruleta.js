import { ruleta } from '../carrito.js';
import { formatoPrecio, fotoGrande, miniatura } from '../datos.js';
import { cargarRuleta, ruletaActual } from '../ruleta-datos.js';
import { panelAbierto } from './panel.js';
import { abrirZoom } from './zoom.js';

// Ruleta del carrito: se abre sobre el carrito, se suma el giro al pedido y se gira (las veces que se quiera).
// Los premios, sus fotos y sus códigos vienen de la pestaña Ruleta de la planilla (ruleta-datos.js).
// El premio lo elige carrito.js (ruleta.girar); acá solo se anima la rueda para que frene en ese premio.
// Se cierra con la X, Escape o el botón "atrás".
const conMovimiento = () => document.documentElement.classList.contains('con-movimiento');
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const el = (sel) => caja.querySelector(sel);

let caja;
let N = 0; // cantidad de premios (gajos)
let A = 0; // grados de cada gajo
let abierta = false;
let empujado = false;
let girando = false;
let giroActual = 0; // grados acumulados de la rueda
const FRENADO = 'cubic-bezier(0.14, 0.82, 0.18, 1)';
let focoPrevio = null;

const REGALO = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4"/></svg>`;

// ---------- La rueda (SVG) ----------
const punto = (r, grados) => {
  const a = ((grados - 90) * Math.PI) / 180;
  return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
};

function rueda() {
  const premios = ruletaActual.premios;
  const colores = premios.map((_, i) => (N % 2 && i === N - 1 ? 'var(--rojo-profundo)' : i % 2 ? '#141416' : 'var(--rojo)'));
  const gajos = premios
    .map((p, i) => {
      // el gajo i queda centrado en i·A grados (0 = arriba, sentido horario)
      const desde = i * A - A / 2;
      const hasta = desde + A;
      const [linea1, linea2] = p.rueda;
      // con foto: el producto en su gajo, siempre derecho para quien mira (gira al revés que la rueda,
      // ver .ruleta-foto-giro); sin foto, el nombre
      const contenido = p.foto
        ? `<g transform="rotate(${i * A}) translate(0 -58)"><g class="ruleta-foto-giro" style="--g:${i * A}deg">
            <image href="${escapar(miniatura(p.foto))}" x="-17" y="-21" width="34" height="42" preserveAspectRatio="xMidYMid meet" class="ruleta-foto"/>
          </g></g>`
        : `<g transform="rotate(${i * A - 90})">
            <text x="87" y="-1.5" class="ruleta-texto1">${escapar(linea1)}</text>
            <text x="87" y="6.5" class="ruleta-texto2">${escapar(linea2)}</text>
          </g>`;
      return `
        <path d="M0 0 L${punto(92, desde)} A92 92 0 0 1 ${punto(92, hasta)} Z" fill="${colores[i]}"/>
        <path d="M${punto(20, desde)} L${punto(92, desde)}" class="ruleta-separador"/>
        ${contenido}`;
    })
    .join('');
  const bombillas = Array.from({ length: N * 2 }, (_, k) => {
    const [x, y] = punto(96.4, k * (A / 2)).split(' ');
    return `<circle cx="${x}" cy="${y}" r="2.1" class="ruleta-bombilla${k % 2 ? ' impar' : ''}"/>`;
  }).join('');
  return `
    <svg class="ruleta-aro" viewBox="-100 -100 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="ruleta-aro-luz" r="0.5">
          <stop offset="0.88" stop-color="#1d1d21"/><stop offset="0.96" stop-color="#2c2c32"/><stop offset="1" stop-color="#0a0a0b"/>
        </radialGradient>
      </defs>
      <circle r="100" fill="url(#ruleta-aro-luz)"/>
      <circle r="99.2" fill="none" stroke="rgb(var(--rojo-rgb) / 0.75)" stroke-width="1"/>
      ${bombillas}
    </svg>
    <svg class="ruleta-rueda" viewBox="-92 -92 184 184" aria-hidden="true">${gajos}
      <circle r="91.6" fill="none" stroke="rgb(255 255 255 / 0.35)" stroke-width="0.8"/>
    </svg>
    <span class="ruleta-centro" aria-hidden="true"><img src="/logo-pesa-centro.png" alt="" width="240" height="240"></span>
    <span class="ruleta-puntero" aria-hidden="true"></span>`;
}

// Los premios en detalle, para verlos antes de girar (tocando uno se ve la foto en grande)
function listaPremios() {
  return ruletaActual.premios
    .map(
      (p, i) => `<li><button type="button" class="ruleta-lista-premio" data-ver-premio="${i}" ${p.foto ? '' : 'disabled'}>
        <span class="ruleta-lista-foto">${p.foto ? `<img src="${escapar(miniatura(p.foto))}" alt="" loading="lazy">` : REGALO}</span>
        <b>${escapar(p.nombre)}</b><small>${escapar(p.marca)}</small>
      </button></li>`,
    )
    .join('');
}

function crear() {
  caja = document.createElement('div');
  caja.className = 'ruleta';
  caja.hidden = true;
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  caja.setAttribute('aria-labelledby', 'ruleta-titulo');
  caja.innerHTML = `
    <button class="ruleta-cerrar" type="button" aria-label="Cerrar ruleta">
      <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
    <div class="ruleta-contenido">
      <p class="etiqueta">Ruleta RepZone</p>
      <h2 class="ruleta-titulo" id="ruleta-titulo">Girá y <span class="rojo">ganá</span></h2>
      <p class="ruleta-bajada"></p>
      <div class="ruleta-caja"></div>
      <div class="ruleta-accion" aria-live="polite"></div>
      <section class="ruleta-lista" aria-labelledby="ruleta-lista-titulo">
        <h3 class="ruleta-lista-titulo" id="ruleta-lista-titulo">Premios que podés ganar</h3>
        <ul class="ruleta-lista-premios"></ul>
        <p class="ruleta-lista-nota">Tocá un premio para verlo en grande.</p>
        <button type="button" class="btn ruleta-lista-jugar" data-ir-jugar>¡Quiero jugar!</button>
      </section>
    </div>
    <div class="ruleta-confeti" aria-hidden="true"></div>`;
  document.body.append(caja);

  caja.addEventListener('click', (e) => {
    if (e.target.closest('.ruleta-cerrar') || e.target.closest('[data-listo]')) return cerrarRuleta();
    if (e.target.closest('[data-comprar]')) {
      if (ruletaActual.activa) ruleta.comprar();
      return pintarAccion();
    }
    // "Girar otra vez": suma otro giro al pedido y gira de una
    if (e.target.closest('[data-otra]')) {
      if (!ruletaActual.activa) return;
      ruleta.comprar();
      pintarAccion();
      return girar();
    }
    if (e.target.closest('[data-girar]')) girar();
    // desde la lista de premios: sube a la rueda para jugar
    if (e.target.closest('[data-ir-jugar]')) {
      el('.ruleta-titulo').scrollIntoView({ behavior: conMovimiento() ? 'smooth' : 'auto', block: 'start' });
      setTimeout(() => el('.ruleta-accion .btn')?.focus({ preventScroll: true }), 400);
    }
    const ver = e.target.closest('[data-ver-premio]');
    if (ver) {
      const p = ruletaActual.premios[ver.dataset.verPremio];
      abrirZoom(fotoGrande(p.foto), `${p.nombre} ${p.marca}`);
    }
  });

  addEventListener(
    'keydown',
    (e) => {
      // con la foto de un premio abierta, Escape cierra solo la foto
      if (!abierta || e.key !== 'Escape' || document.querySelector('.zoom:not([hidden])')) return;
      e.stopPropagation();
      cerrarRuleta();
    },
    true,
  );
  addEventListener('popstate', () => abierta && !history.state?.ruleta && ((empujado = false), cerrarRuleta()));
}

// Rueda, lista y precio con los premios actuales (pueden cambiar desde la planilla)
function rehacer() {
  N = ruletaActual.premios.length;
  A = 360 / N;
  el('.ruleta-bajada').innerHTML = `Sumá un giro a tu pedido por <b>${formatoPrecio(ruletaActual.precio)}</b>. ¡Siempre te llevás un premio!`;
  el('.ruleta-caja').innerHTML = rueda();
  el('.ruleta-lista-premios').innerHTML = listaPremios();
}

// ---------- Botón o resultado, según el estado del giro ----------
const otraVez = () => `<button type="button" class="btn" data-otra>Girar otra vez · ${formatoPrecio(ruletaActual.precio)}</button>`;

function pintarAccion({ festejo = false } = {}) {
  const accion = el('.ruleta-accion');
  if (ruleta.pendientes()) {
    accion.innerHTML = `<button type="button" class="btn ruleta-girar" data-girar>¡Girar!</button>`;
    return;
  }
  const premios = ruleta.premios();
  if (festejo) {
    const p = premios[premios.length - 1];
    accion.innerHTML = `
      <div class="ruleta-premio${festejo ? ' nuevo' : ''}">
        <span class="ruleta-premio-foto">${p.foto ? `<img src="${escapar(miniatura(p.foto))}" alt="">` : REGALO}</span>
        <span class="ruleta-premio-texto">
          <small>¡Te tocó!</small>
          <b>${escapar(p.nombre)}</b>
          <span>${escapar(p.marca)}</span>
          ${p.codigo ? `<span class="ruleta-codigo">Código <b>${escapar(p.codigo)}</b></span>` : ''}
        </span>
      </div>
      <p class="ruleta-nota">Va con tu pedido y su código: lo coordinamos por WhatsApp.</p>
      ${ruletaActual.activa ? otraVez() : ''}
      <button type="button" class="ruleta-listo" data-listo>Listo, volver al carrito</button>`;
    return;
  }
  if (!ruletaActual.activa) {
    accion.innerHTML = '<p class="ruleta-nota">La ruleta no está disponible en este momento.</p>';
    return;
  }
  accion.innerHTML = premios.length
    ? `${otraVez()}<p class="ruleta-nota">Ya ganaste ${premios.length === 1 ? 'un premio' : `${premios.length} premios`}: los ves en tu carrito.</p>`
    : `<button type="button" class="btn" data-comprar>Sumar giro · ${formatoPrecio(ruletaActual.precio)}</button>`;
}

// ---------- El giro ----------
function girar() {
  if (girando || !ruleta.pendientes()) return;
  girando = true;
  const i = ruleta.girar();
  const boton = el('[data-girar]');
  boton.disabled = true;
  boton.textContent = 'Girando…';
  caja.classList.add('girando');

  // la rueda frena con el premio bajo el puntero, en un lugar al azar dentro de su gajo
  const corrimiento = (Math.random() - 0.5) * A * 0.7;
  const destino = (((-i * A + corrimiento - giroActual) % 360) + 360) % 360;
  const vueltas = conMovimiento() ? 6 : 1;
  giroActual += vueltas * 360 + destino;
  const duracion = conMovimiento() ? 5600 : 1200;
  const disco = el('.ruleta-rueda');
  disco.style.transition = `transform ${duracion}ms ${FRENADO}`;
  disco.style.transform = `rotate(${giroActual}deg)`;
  // las fotos giran al revés, con el mismo tiempo y frenado: quedan derechas todo el giro
  disco.style.setProperty('--duracion', `${duracion}ms`);
  disco.style.setProperty('--giro', `${giroActual}deg`);
  if (conMovimiento()) tictac(disco);

  setTimeout(() => {
    girando = false;
    caja.classList.remove('girando');
    pintarAccion({ festejo: true });
    if (conMovimiento()) confeti();
    navigator.vibrate?.([40, 60, 40]);
  }, duracion + 150);
}

// El puntero "golpea" cada vez que pasa un gajo
function tictac(disco) {
  const puntero = el('.ruleta-puntero');
  let previo = null;
  const cuadro = () => {
    if (!girando) return;
    const m = getComputedStyle(disco).transform.match(/matrix\(([^,]+),\s*([^,]+)/);
    if (m) {
      const grados = (Math.atan2(Number(m[2]), Number(m[1])) * 180) / Math.PI;
      const gajo = Math.round((((-grados % 360) + 360) % 360) / A) % N;
      if (previo !== null && gajo !== previo) {
        puntero.animate([{ transform: 'rotate(-24deg)' }, { transform: 'rotate(0deg)' }], { duration: 160, easing: 'ease-out' });
      }
      previo = gajo;
    }
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

function confeti() {
  const capa = el('.ruleta-confeti');
  const colores = ['var(--rojo)', '#ffffff', '#ffc83d', 'var(--rojo-vivo)'];
  let html = '';
  for (let k = 0; k < 70; k++) {
    const r = (a, b) => (a + Math.random() * (b - a)).toFixed(1);
    html += `<span style="--x:${r(-48, 48)}vw;--y:${r(-55, -20)}vh;--caida:${r(30, 60)}vh;--g:${r(-540, 540)}deg;--d:${r(0, 0.25)}s;--t:${r(1.6, 2.4)}s;background:${colores[k % colores.length]};${k % 3 ? '' : 'border-radius:50%;'}"></span>`;
  }
  capa.innerHTML = html;
  setTimeout(() => (capa.innerHTML = ''), 2800);
}

// ---------- Abrir y cerrar ----------
// verPremios: abre mostrando la lista de premios (desde "Ver posibles premios" del carrito)
export async function abrirRuleta({ verPremios = false } = {}) {
  await cargarRuleta();
  if (!caja) crear();
  rehacer();
  focoPrevio = document.activeElement;
  // la rueda aparece frenada en el último premio que salió (si sigue en la rueda)
  const ultimo = ruleta.premios().at(-1);
  const lugar = ultimo ? ruletaActual.premios.findIndex((p) => p.nombre === ultimo.nombre && p.marca === ultimo.marca) : -1;
  const disco = el('.ruleta-rueda');
  disco.style.transition = 'none';
  giroActual = lugar >= 0 ? -lugar * A : 0;
  disco.style.transform = `rotate(${giroActual}deg)`;
  disco.style.setProperty('--duracion', '0ms');
  disco.style.setProperty('--giro', `${giroActual}deg`);
  pintarAccion();
  // "atrás" cierra la ruleta y deja el carrito abierto
  const panel = panelAbierto();
  if (panel && !history.state?.panel) history.replaceState({ ...(history.state || {}), panel: panel.id }, '');
  history.pushState({ ...(history.state || {}), ruleta: true }, '');
  empujado = true;
  abierta = true;
  caja.hidden = false;
  caja.scrollTop = 0;
  requestAnimationFrame(() => {
    caja.classList.add('abierta');
    if (verPremios) el('.ruleta-lista').scrollIntoView({ block: 'start' });
  });
  el('.ruleta-accion .btn')?.focus({ preventScroll: true });
}

export function cerrarRuleta() {
  if (!abierta) return;
  abierta = false;
  if (empujado) {
    empujado = false;
    history.back();
  }
  caja.classList.remove('abierta');
  const fin = () => (caja.hidden = true);
  if (conMovimiento()) setTimeout(fin, 300);
  else fin();
  focoPrevio?.focus?.({ preventScroll: true });
}
