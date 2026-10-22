import { cargarCatalogo, formatoPrecio, descuento, miniatura } from '../datos.js';
import { carrito, precioDe } from '../carrito.js';
import { linkWhatsApp } from '../config.js';
import { abrirPanel, abrirPanelDirecto, cerrarPanel } from './panel.js';
import { icono, beneficio, colorSabor, tintaSobre } from './iconos.js';
import { avisar } from './aviso.js';
import { abrirZoom } from './zoom.js';

const el = (id) => document.getElementById(id);
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const parrafos = (t) => escapar(t).split(/\n+/).map((l) => `<p>${l}</p>`).join('');

let catalogo = [];
let estado = null; // { p, sabor, tamano, cantidad }

export async function iniciarFicha() {
  catalogo = await cargarCatalogo();
  addEventListener('abrir-producto', (e) => abrir(e.detail));

  el('ficha').addEventListener('click', (e) => {
    // la lupa o la foto misma: foto ampliada (la que se está viendo en la galería)
    if (estado && e.target.closest('[data-zoom], .ficha-foto img')) {
      const galeria = el('ficha-galeria');
      const i = Math.round(galeria.scrollLeft / galeria.clientWidth);
      return abrirZoom(estado.p.fotos[i] ?? estado.p.fotos[0], estado.p.nombre);
    }
    const b = e.target.closest('[data-sabor], [data-tamano], [data-cantidad], [data-agregar], [data-foto]');
    if (!b || !estado) return;
    if (b.dataset.sabor !== undefined) estado.sabor = b.dataset.sabor;
    if (b.dataset.tamano !== undefined) estado.tamano = b.dataset.tamano;
    if (b.dataset.cantidad) estado.cantidad = Math.max(1, Math.min(99, estado.cantidad + Number(b.dataset.cantidad)));
    if (b.dataset.foto) el('ficha-galeria').scrollTo({ left: el('ficha-galeria').clientWidth * Number(b.dataset.foto), behavior: 'smooth' });
    if (b.hasAttribute('data-agregar')) return agregar();
    actualizar();
  });

  // Entrar directo con el link de un producto: #p/star-whey-doypack-1kg
  const id = decodeURIComponent(location.hash).match(/^#p\/(.+)$/)?.[1];
  if (id) {
    const abrirAlCargar = () => abrir(id, { directo: true });
    if (document.documentElement.classList.contains('cargando')) addEventListener('carga-lista', abrirAlCargar, { once: true });
    else abrirAlCargar();
  }
}

function abrir(id, { directo = false } = {}) {
  const p = catalogo.find((x) => x.id === id);
  if (!p) return;
  estado = {
    p,
    // con un solo sabor no hace falta elegir; con varios, que lo elija la persona
    sabor: p.sabores.length === 1 ? p.sabores[0].nombre : null,
    tamano: p.tamanos[0]?.nombre ?? null,
    cantidad: 1,
  };
  pintar();
  if (directo) abrirPanelDirecto(el('ficha'));
  else abrirPanel(el('ficha'), { url: `#p/${encodeURIComponent(p.id)}` });
}

// Puntitos blancos que suben despacio detrás del producto (cada uno con su tamaño, ritmo y recorrido)
function particulas(n = 22) {
  let html = '';
  for (let i = 0; i < n; i++) {
    const r = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
    html += `<span style="--x:${r(4, 96)}%;--t:${r(1.5, 4)}px;--d:${r(5, 11)}s;--r:-${r(0, 11)}s;--o:${r(0.35, 0.9)};--m:${r(-18, 18)}px"></span>`;
  }
  return html;
}

function pintar() {
  const { p } = estado;
  const off = descuento(p);
  const fotos = p.fotos.length ? p.fotos : [];
  const beneficios = p.beneficios.map(beneficio);
  const tecnica = [
    ['Modo de uso', p.modoUso],
    ['Composición', p.composicion],
    ['Tabla nutricional', p.tablaNutricional],
  ].filter(([, t]) => t);
  const consulta = linkWhatsApp(`¡Hola RepZone! Quería consultar por ${p.nombre} (${p.marca}).`);

  el('ficha-cuerpo').innerHTML = `
    <div class="ficha-galeria-caja" data-entra>
      <div class="particulas" aria-hidden="true">${particulas()}</div>
      <div class="ficha-galeria" id="ficha-galeria">
        ${fotos.map((f, i) => `<div class="ficha-foto"><img src="${f}" alt="${i ? '' : escapar(p.nombre)}" ${i ? 'loading="lazy"' : ''}></div>`).join('')}
      </div>
      ${fotos.length ? `<button type="button" class="ficha-zoom" data-zoom aria-label="Ver la foto en grande"><svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg></button>` : ''}
      ${fotos.length > 1 ? `<div class="ficha-miniaturas">${fotos.map((f, i) => `<button type="button" data-foto="${i}" aria-label="Ver foto ${i + 1}"><img src="${miniatura(f)}" alt=""></button>`).join('')}</div>` : ''}
      <div class="chapas">
        ${off ? `<span class="chapa chapa-off">-${off}%</span>` : ''}
        ${p.combo ? '<span class="chapa chapa-combo">Combo</span>' : ''}
      </div>
    </div>

    <div class="ficha-info">
      <div class="ficha-titulo" data-entra>
        <span class="producto-marca">${escapar(p.marca)}</span>
        <h2 class="ficha-nombre" id="ficha-nombre">${escapar(p.nombre)}</h2>
        <p class="ficha-precio" id="ficha-precio"></p>
      </div>

      <details class="ficha-tecnica" data-entra>
        <summary>Información técnica <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
        <div class="ficha-tecnica-cuerpo">
          ${tecnica.map(([t, txt]) => `<h4>${t}</h4>${parrafos(txt)}`).join('')}
          <p class="ficha-tecnica-consulta">¿Necesitás la tabla nutricional o tenés alguna duda? <a href="${consulta}" target="_blank" rel="noopener">Consultanos por WhatsApp</a>.</p>
        </div>
      </details>

      ${
        beneficios.length
          ? `<div class="ficha-bloque" data-entra>
        <h3 class="ficha-sub">¿Por qué elegirlo?</h3>
        <ul class="beneficios">
          ${beneficios.map((b) => `<li class="beneficio"><span class="beneficio-icono">${icono(b.clave)}</span><span>${escapar(b.texto)}</span></li>`).join('')}
        </ul>
      </div>`
          : ''
      }

      ${
        p.sabores.length
          ? `<div class="ficha-bloque" id="ficha-sabores" data-entra>
        <h3 class="ficha-sub">Sabor <span id="ficha-sabor-elegido"></span></h3>
        <div class="opciones">
          ${p.sabores
            .map((s) => {
              const c = colorSabor(s);
              return `<button type="button" class="opcion opcion-sabor" data-sabor="${escapar(s.nombre)}" ${c ? `style="--sabor:${c};--tinta:${tintaSobre(c)}"` : ''}>
                ${c ? '<span class="opcion-punto"></span>' : ''}${escapar(s.nombre)}</button>`;
            })
            .join('')}
        </div>
      </div>`
          : ''
      }

      ${
        p.tamanos.length > 1
          ? `<div class="ficha-bloque" data-entra>
        <h3 class="ficha-sub">Tamaño</h3>
        <div class="opciones">
          ${p.tamanos.map((t) => `<button type="button" class="opcion" data-tamano="${escapar(t.nombre)}">${escapar(t.nombre)}<small>${formatoPrecio(t.precio)}</small></button>`).join('')}
        </div>
      </div>`
          : ''
      }

      ${p.combo ? `<p class="ficha-nota" data-entra>${icono('pack')}<span>Si el combo lleva sabores, los elegís cuando nos escribís por WhatsApp.</span></p>` : ''}

    </div>`;

  // galería: al deslizar se marca la miniatura
  const galeria = el('ficha-galeria');
  galeria.addEventListener(
    'scroll',
    () => {
      const i = Math.round(galeria.scrollLeft / galeria.clientWidth);
      el('ficha-cuerpo').querySelectorAll('[data-foto]').forEach((b, j) => b.setAttribute('aria-current', String(i === j)));
    },
    { passive: true },
  );
  actualizar();
}

function actualizar() {
  const { p, sabor, tamano, cantidad } = estado;
  const precio = precioDe(p, tamano);
  el('ficha-precio').innerHTML = `<b>${formatoPrecio(precio)}</b>${p.precioAnterior > p.precio && !tamano ? `<s>${formatoPrecio(p.precioAnterior)}</s>` : ''}`;
  el('ficha').querySelectorAll('[data-sabor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sabor === sabor)));
  el('ficha').querySelectorAll('[data-tamano]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tamano === tamano)));
  el('ficha').querySelectorAll('[data-foto]').forEach((b, i) => !b.hasAttribute('aria-current') && b.setAttribute('aria-current', String(i === 0)));
  const elegido = el('ficha-sabor-elegido');
  if (elegido) elegido.textContent = sabor ? `· ${sabor}` : '';

  const falta = p.sabores.length > 1 && !sabor;
  el('ficha-pie').innerHTML = `
    <div class="cantidad" role="group" aria-label="Cantidad">
      <button type="button" data-cantidad="-1" aria-label="Restar uno" ${cantidad <= 1 ? 'disabled' : ''}>−</button>
      <output aria-live="polite">${cantidad}</output>
      <button type="button" data-cantidad="1" aria-label="Sumar uno">+</button>
    </div>
    <button type="button" class="btn ficha-agregar${falta ? ' falta' : ''}" data-agregar>
      ${falta ? 'Elegí un sabor' : `Agregar · ${formatoPrecio(precio * cantidad)}`}
    </button>`;
}

function agregar() {
  const { p, sabor, tamano, cantidad } = estado;
  if (p.sabores.length > 1 && !sabor) {
    const caja = el('ficha-sabores');
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
    caja.classList.remove('sacudir');
    void caja.offsetWidth;
    caja.classList.add('sacudir');
    return;
  }
  carrito.agregar({ id: p.id, sabor, tamano, cantidad });
  cerrarPanel();
  avisar(`${cantidad > 1 ? `${cantidad}x ` : ''}${p.nombre} se agregó al carrito`, {
    accion: 'Ver carrito',
    alTocar: () => dispatchEvent(new CustomEvent('abrir-carrito')),
  });
}
