import { panelAbierto } from './panel.js';

// Foto ampliada: la foto del producto casi a pantalla completa, sobre un fondo translúcido.
// Tocar la foto la acerca (y moviendo el dedo o el mouse se recorre); tocar de nuevo la aleja.
// Se cierra con la X, tocando afuera, con Escape o con el botón "atrás" del celular.
let caja;
let img;
let abierta = false;
let empujado = false;
let focoPrevio = null;

function crear() {
  caja = document.createElement('div');
  caja.className = 'zoom';
  caja.hidden = true;
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  caja.setAttribute('aria-label', 'Foto ampliada');
  caja.innerHTML = `
    <button class="zoom-cerrar" type="button" aria-label="Cerrar foto">
      <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
    <img class="zoom-img" alt="">
    <p class="zoom-ayuda">Tocá la foto para acercar</p>`;
  document.body.append(caja);
  img = caja.querySelector('.zoom-img');

  // tocar afuera de la foto o la X cierra
  caja.addEventListener('click', (e) => {
    if (e.target === caja || e.target.closest('.zoom-cerrar')) cerrarZoom();
  });

  // acercar/alejar con un toque; si el dedo se arrastró, era para recorrer la foto y no cuenta
  let inicio = null;
  let arrastre = false;
  const origen = (e) => {
    const r = img.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    img.style.transformOrigin = `${x}% ${y}%`;
  };
  img.addEventListener('pointerdown', (e) => {
    inicio = { x: e.clientX, y: e.clientY };
    arrastre = false;
  });
  img.addEventListener('pointermove', (e) => {
    if (inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 8) arrastre = true;
    // con el mouse se recorre solo con moverlo; con el dedo, arrastrando
    if (img.classList.contains('acercada') && (e.pointerType === 'mouse' || inicio)) origen(e);
  });
  addEventListener('pointerup', () => (inicio = null));
  img.addEventListener('click', (e) => {
    if (arrastre) return;
    if (!img.classList.contains('acercada')) origen(e);
    img.classList.toggle('acercada');
    caja.classList.add('usada');
  });

  // Escape y Tab se atienden acá antes que en el panel de abajo
  addEventListener(
    'keydown',
    (e) => {
      if (!abierta) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        cerrarZoom();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        caja.querySelector('.zoom-cerrar').focus();
      }
    },
    true,
  );

  addEventListener('popstate', () => abierta && !history.state?.zoom && ((empujado = false), cerrarZoom()));
}

export function abrirZoom(src, alt = '') {
  if (!caja) crear();
  img.src = src;
  img.alt = alt;
  img.classList.remove('acercada');
  img.style.transformOrigin = '';
  caja.classList.remove('usada');
  focoPrevio = document.activeElement;
  // "atrás" cierra la foto y deja la ficha abierta
  const panel = panelAbierto();
  if (panel && !history.state?.panel) history.replaceState({ ...(history.state || {}), panel: panel.id }, '');
  history.pushState({ ...(history.state || {}), zoom: true }, '');
  empujado = true;
  abierta = true;
  caja.hidden = false;
  requestAnimationFrame(() => caja.classList.add('abierta'));
  caja.querySelector('.zoom-cerrar').focus({ preventScroll: true });
}

export function cerrarZoom() {
  if (!abierta) return;
  abierta = false;
  if (empujado) {
    empujado = false;
    history.back();
  }
  caja.classList.remove('abierta');
  const fin = () => (caja.hidden = true);
  if (document.documentElement.classList.contains('con-movimiento')) setTimeout(fin, 250);
  else fin();
  focoPrevio?.focus?.({ preventScroll: true });
}
