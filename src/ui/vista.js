import { gsap } from 'gsap';
import { cargarCatalogo, formatoPrecio, descuento } from '../datos.js';
import { tarjeta, aparecer } from './grilla.js';

// Vistas propias de Combos (#combos) y Ofertas (#ofertas): reemplazan el contenido de la página
// hasta que la persona vuelve. El botón "atrás" del celular también vuelve.
const flecha = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>`;

const VISTAS = {
  combos: {
    titulo: 'Combos',
    bajada: 'Packs armados con precio fijo. Se suman al carrito como cualquier producto.',
    prueba: (p) => p.combo,
    etiqueta: (ls) => `Desde ${formatoPrecio(Math.min(...ls.map((p) => p.precio)))}`,
    ordenes: [
      ['destacados', 'Destacados', (a, b) => b.tendencia - a.tendencia],
      ['menor', 'Menor precio', (a, b) => a.precio - b.precio],
      ['mayor', 'Mayor precio', (a, b) => b.precio - a.precio],
    ],
  },
  ofertas: {
    titulo: 'Ofertas',
    bajada: 'Precios especiales por tiempo limitado. Valen para envío y para retiro.',
    prueba: (p) => p.oferta,
    etiqueta: (ls) => `Hasta ${Math.max(...ls.map(descuento))}% OFF`,
    ordenes: [
      ['descuento', 'Mayor descuento', (a, b) => descuento(b) - descuento(a)],
      ['menor', 'Menor precio', (a, b) => a.precio - b.precio],
    ],
  },
};

const el = (id) => document.getElementById(id);
const raiz = document.documentElement;
let catalogo = null;
let actual = null; // 'combos' | 'ofertas' | null
let orden = null;
let scrollPrevio = 0;
let vinoDeAdentro = false;

const deRuta = () => {
  const h = location.hash.slice(1);
  return VISTAS[h] ? h : null;
};

export function iniciarVista() {
  // se registra antes que la grilla: al pasar de una vista a una categoría, primero se cierra la vista
  addEventListener('hashchange', () => {
    vinoDeAdentro = true;
    // misma vista (ej. al volver de una ficha abierta dentro) o fuera de las vistas: no cambia nada
    if (deRuta() === actual) return;
    cambiar(deRuta());
  });
  el('vista').addEventListener('click', (e) => {
    if (e.target.closest('[data-volver]')) volver();
    const o = e.target.closest('[data-orden]');
    if (o) {
      orden = o.dataset.orden;
      pintar({ animar: false });
    }
  });
  cargarCatalogo().then((c) => {
    catalogo = c;
    if (deRuta()) cambiar(deRuta());
  });
}

function volver() {
  if (vinoDeAdentro) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    cambiar(null);
  }
}

function cambiar(nombre) {
  if (!catalogo) return;
  if (nombre && !actual) scrollPrevio = scrollY;
  actual = nombre;
  el('vista').hidden = !nombre;
  raiz.classList.toggle('en-vista', Boolean(nombre));
  if (!nombre) {
    scrollTo({ top: scrollPrevio, behavior: 'instant' });
    return;
  }
  orden = VISTAS[nombre].ordenes[0][0];
  scrollTo({ top: 0, behavior: 'instant' });
  pintar({ animar: true });
}

function pintar({ animar }) {
  const v = VISTAS[actual];
  const [, , comparar] = v.ordenes.find(([id]) => id === orden);
  const lista = catalogo.filter((p) => v.prueba(p) && p.precio && p.fotos.length).sort(comparar);

  el('vista').className = `vista vista-${actual}`;
  el('vista').innerHTML = `
    <header class="vista-cabecera">
      <div class="escenario" aria-hidden="true"><span class="escenario-textura"></span><span class="escenario-glow"></span></div>
      <div class="contenedor">
        <button class="vista-volver" type="button" data-volver>${flecha}<span>Volver</span></button>
        ${lista.length ? `<span class="gancho-etiqueta vista-etiqueta">${v.etiqueta(lista)}</span>` : ''}
        <h1 class="vista-titulo">${v.titulo}</h1>
        <p class="vista-bajada">${v.bajada}</p>
        <div class="vista-ordenes" role="group" aria-label="Ordenar">
          <span>${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}</span>
          ${v.ordenes.map(([id, txt]) => `<button type="button" class="filtro" data-orden="${id}" aria-pressed="${id === orden}">${txt}</button>`).join('')}
        </div>
      </div>
    </header>
    <div class="contenedor vista-cuerpo">
      ${
        lista.length
          ? `<ul class="grilla">${lista.map((p, i) => tarjeta(p, i, { destacar: false, chapaCombo: false, ahorro: actual === 'ofertas' })).join('')}</ul>`
          : `<p class="vista-vacia">Ahora no hay ${v.titulo.toLowerCase()} disponibles. Escribinos y te avisamos cuando haya.</p>`
      }
      <div class="vista-pie">
        <a class="btn btn-claro" href="#productos">Ver todo el catálogo</a>
      </div>
    </div>`;
  aparecer(el('vista').querySelectorAll('.producto'));
  if (animar && raiz.classList.contains('con-movimiento')) {
    gsap.from(el('vista').querySelectorAll('.vista-cabecera .contenedor > *'), {
      y: 24,
      opacity: 0,
      duration: 0.6,
      stagger: 0.06,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    });
  }
}
