import { cargarCatalogo, formatoPrecio, descuento, buscar, miniatura, fotoAdaptable } from '../datos.js';
import { CATEGORIAS } from '../config.js';

const POR_PAGINA = 24;
const fuego = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`;
const paquete = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5zM3.4 11.3 2 12l10 5 10-5-1.4-.7L12 14.6l-8.6-3.3zm0 5L2 17l10 5 10-5-1.4-.7L12 19.6l-8.6-3.3z"/></svg>`;
const rayo = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>`;
const svg = (trazos) => `<svg viewBox="0 0 24 24" aria-hidden="true">${trazos}</svg>`;

// Ícono de cada botón de la fila de categorías (las que tienen una imagen reconocible)
const ICONOS_FILTRO = {
  ofertas: rayo,
  combos: paquete,
  // tarro de proteína
  proteinas: svg('<path d="M7 2.5h10a1 1 0 0 1 1 1V6H6V3.5a1 1 0 0 1 1-1z"/><path fill-rule="evenodd" d="M5.5 7.5h13a1 1 0 0 1 1 1V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V8.5a1 1 0 0 1 1-1zM7.5 11v6h9v-6z"/>'),
  // medidor con polvo
  creatinas: svg('<path d="M4.5 7.2C5.4 5.2 8 4.4 9 5.6c1-1.5 4.2-1 4.5 1.6z"/><path d="M3 9h11.5v1.5A5.75 5.75 0 0 1 8.75 16.25 5.75 5.75 0 0 1 3 10.5zM15.5 9.6l5.6-1.1a1.1 1.1 0 0 1 .4 2.2l-6 1.2z"/>'),
  // cápsula
  omega3: svg('<path d="M10.4 4.1a5 5 0 0 1 7.1 7.1l-3.2 3.2-7.1-7.1z"/><path d="M6.2 8.3l7.1 7.1-3.6 3.6a5 5 0 0 1-7.1-7.1z" opacity=".55"/>'),
  // llama
  'pre-entrenos': fuego,
  // avión
  importados: svg('<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>'),
  // vaso shaker
  shakers: svg('<path d="M10 1.5h3v2.5h-3z"/><path d="M6.5 4.5h11a1 1 0 0 1 1 1V8h-13V5.5a1 1 0 0 1 1-1z"/><path fill-rule="evenodd" d="M6 9h12l-1.4 12a1.2 1.2 0 0 1-1.2 1H8.6a1.2 1.2 0 0 1-1.2-1zM8.4 12l.3 3h6.6l.3-3z"/>'),
  // hoja
  alimentos: svg('<path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>'),
};

let catalogo = [];
let estado = { filtro: 'todos', busqueda: '', mostrados: POR_PAGINA };
let observador;

const el = (id) => document.getElementById(id);

// Filtros fijos arriba de las categorías
const ESPECIALES = [
  { id: 'todos', nombre: 'Todos', prueba: () => true },
  { id: 'ofertas', nombre: 'Ofertas', prueba: (p) => p.oferta },
  { id: 'combos', nombre: 'Combos', prueba: (p) => p.combo },
];
const filtros = () => [...ESPECIALES, ...CATEGORIAS.map((c) => ({ ...c, prueba: (p) => p.categoria === c.id }))];

export async function iniciarGrilla() {
  catalogo = await cargarCatalogo();
  pintarFiltros();
  iniciarFlechasFiltros();
  el('grilla-mas').addEventListener('click', () => {
    estado.mostrados += POR_PAGINA;
    pintar({ desde: estado.mostrados - POR_PAGINA });
  });
  el('catalogo-busqueda-borrar').addEventListener('click', () => aplicar({ busqueda: '' }));
  // al cerrar una ficha o el carrito con "atrás" no se vuelve a filtrar ni a desplazar
  addEventListener('hashchange', () => !history.state?.volviendoDePanel && leerRuta());
  // tocar de nuevo el mismo link (ej. "Combos" dos veces) no cambia el hash: se aplica igual
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash) leerRuta();
  });
  // tocar una tarjeta (de la grilla o de las vistas de combos/ofertas) abre su ficha
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.producto-tocar');
    if (b) dispatchEvent(new CustomEvent('abrir-producto', { detail: b.dataset.id }));
  });
  if (!leerRuta()) pintar();
}

// Rutas de la grilla: #productos, #categoria/proteinas, #filtro/ofertas
// (#combos y #ofertas solas abren su vista propia: ver vista.js)
function leerRuta() {
  const h = decodeURIComponent(location.hash.slice(1));
  const id = /^(categoria|filtro)\//.test(h) ? h.split('/')[1] : h === 'productos' ? 'todos' : null;
  if (!id) return false;
  if (!filtros().some((f) => f.id === id)) return false;
  aplicar({ filtro: id, busqueda: '' }, { desplazar: true });
  return true;
}

export function aplicar(cambios, { desplazar = false, resaltar } = {}) {
  estado = { ...estado, ...cambios, mostrados: POR_PAGINA };
  pintarFiltros();
  pintar();
  if (desplazar) el('productos').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (resaltar) {
    const tarjeta = el('grilla').querySelector(`[data-id="${CSS.escape(resaltar)}"]`)?.closest('.producto');
    if (tarjeta) {
      setTimeout(() => tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' }), desplazar ? 450 : 0);
      tarjeta.classList.add('resaltado');
      setTimeout(() => tarjeta.classList.remove('resaltado'), 2600);
    }
  }
}

// Flechas de la fila de categorías: cada una aparece solo si hay más botones hacia ese lado
function iniciarFlechasFiltros() {
  const fila = el('filtros');
  const ant = el('filtros-ant');
  const sig = el('filtros-sig');
  const actualizar = () => {
    ant.hidden = fila.scrollLeft <= 4;
    sig.hidden = fila.scrollLeft + fila.clientWidth >= fila.scrollWidth - 4;
  };
  const mover = (dir) => fila.scrollBy({ left: dir * fila.clientWidth * 0.7, behavior: 'smooth' });
  ant.addEventListener('click', () => mover(-1));
  sig.addEventListener('click', () => mover(1));
  fila.addEventListener('scroll', actualizar, { passive: true });
  addEventListener('resize', actualizar);
  document.fonts?.ready.then(actualizar);
  actualizar();
}

function pintarFiltros() {
  const caja = el('filtros');
  const desplazado = caja.scrollLeft;
  const conteo = (f) => catalogo.filter(f.prueba).length;
  caja.innerHTML = filtros()
    .filter((f) => f.id === 'todos' || conteo(f) > 0)
    .map(
      (f) => `<button type="button" class="filtro filtro-${f.id}" data-filtro="${f.id}" aria-pressed="${!estado.busqueda && estado.filtro === f.id}">
        ${ICONOS_FILTRO[f.id] ?? ''}<span>${f.nombre}</span><small>${conteo(f)}</small></button>`,
    )
    .join('');
  caja.scrollLeft = desplazado;
  caja.querySelectorAll('[data-filtro]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.filtro;
      history.replaceState(null, '', id === 'todos' ? '#productos' : ESPECIALES.some((e) => e.id === id) ? `#filtro/${id}` : `#categoria/${id}`);
      aplicar({ filtro: id, busqueda: '' }, { desplazar: true });
      // la fila se vuelve a dibujar: centra el botón elegido (el nuevo) sin mover la página
      const fila = el('filtros');
      const nuevo = fila.querySelector(`[data-filtro="${id}"]`);
      fila.scrollLeft = Math.max(0, nuevo.offsetLeft - (fila.clientWidth - nuevo.offsetWidth) / 2);
    }),
  );
}

// "Todos": una sección por categoría, en el orden del menú, con los combos al final
// (ya están arriba de todo en el carrusel). Dentro de cada una, tendencias y ofertas primero.
const SECCIONES = () => [...CATEGORIAS, { id: 'combos', nombre: 'Combos' }];
const seccionDe = (p) => (SECCIONES().some((s) => s.id === p.categoria) ? p.categoria : 'otros');
const destacarPrimero = (a, b) => b.tendencia * 2 + b.oferta - (a.tendencia * 2 + a.oferta);

function ordenar(lista) {
  const orden = [...SECCIONES().map((s) => s.id), 'otros'];
  return lista
    .map((p, i) => ({ p, i }))
    .sort((a, b) => orden.indexOf(seccionDe(a.p)) - orden.indexOf(seccionDe(b.p)) || destacarPrimero(a.p, b.p) || a.i - b.i)
    .map((x) => x.p);
}

function lista() {
  if (estado.busqueda) return buscar(catalogo, estado.busqueda);
  const f = filtros().find((x) => x.id === estado.filtro);
  const elegidos = catalogo.filter(f.prueba);
  if (estado.filtro === 'todos') return ordenar(elegidos);
  // dentro de una categoría: ofertas y tendencias primero
  return elegidos.sort((a, b) => b.oferta + b.tendencia - (a.oferta + a.tendencia));
}

// Tarjeta de producto. La usan la grilla y las vistas de combos y ofertas.
export function tarjeta(p, i, { destacar = !estado.busqueda, chapaCombo = estado.filtro !== 'combos', ahorro = false } = {}) {
  const off = descuento(p);
  const destacado = destacar && p.tendencia;
  // contrastes que varían: fondo de foto oscuro, claro o con foco rojo
  const tono = destacado ? 'foco' : ['oscuro', 'oscuro', 'claro', 'oscuro', 'humo'][i % 5];
  const etiquetas = [
    off ? `<span class="chapa chapa-off">-${off}%</span>` : '',
    destacado ? `<span class="chapa chapa-tendencia">${fuego}Tendencia</span>` : '',
    p.combo && chapaCombo ? '<span class="chapa chapa-combo">Combo</span>' : '',
  ].join('');
  return `
    <li class="producto tono-${tono}${destacado ? ' destacado' : ''}" style="--d:${i % 4}">
      <button class="producto-tocar" type="button" data-id="${p.id}" aria-label="${p.nombre}, ${p.marca}, ${formatoPrecio(p.precio)}"></button>
      <div class="producto-foto">
        <img ${destacado ? fotoAdaptable(p.fotos[0], '(min-width: 1024px) 45vw, 75vw') : `src="${miniatura(p.fotos[0])}"`} alt="" loading="lazy" decoding="async">
        <div class="chapas">${etiquetas}</div>
      </div>
      <div class="producto-info">
        <span class="producto-marca">${p.marca}</span>
        <h3 class="producto-nombre">${p.nombre}</h3>
        <p class="producto-precio">
          ${p.tamanos.length > 1 ? '<small>desde</small>' : ''}<b>${formatoPrecio(p.precio)}</b>
          ${p.precioAnterior > p.precio ? `<s>${formatoPrecio(p.precioAnterior)}</s>` : ''}
        </p>
        ${ahorro && p.precioAnterior > p.precio ? `<p class="producto-ahorro">Ahorrás ${formatoPrecio(p.precioAnterior - p.precio)}</p>` : ''}
      </div>
    </li>`;
}

// Título de sección: queda fijo debajo de la fila de categorías mientras se recorre su grupo
function seccion(clave, cantidad) {
  if (!clave) return '<div data-seccion=""><ul class="grilla"></ul></div>';
  const nombre = SECCIONES().find((s) => s.id === clave)?.nombre ?? 'Otros productos';
  return `<section class="grilla-seccion" data-seccion="${clave}" aria-labelledby="seccion-${clave}">
      <h3 class="grilla-titulo" id="seccion-${clave}"><span>${nombre}</span><small>${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}</small></h3>
      <ul class="grilla"></ul>
    </section>`;
}

function pintar({ desde = 0 } = {}) {
  const todos = lista().filter((p) => p.precio && p.fotos.length);
  const visibles = todos.slice(0, estado.mostrados);
  const grilla = el('grilla');
  if (!desde) grilla.innerHTML = '';
  // en "Todos" se agrupa por categoría; filtrado o buscando, una sola grilla
  const agrupar = estado.filtro === 'todos' && !estado.busqueda;
  const clave = (p) => (agrupar ? seccionDe(p) : '');
  // cada tramo de tarjetas de una misma sección va a su grilla (al pedir "Ver más" puede seguir la última)
  for (let i = desde; i < visibles.length; ) {
    const c = clave(visibles[i]);
    let j = i;
    while (j < visibles.length && clave(visibles[j]) === c) j++;
    let ul = grilla.querySelector(`[data-seccion="${c}"] .grilla`);
    if (!ul) {
      grilla.insertAdjacentHTML('beforeend', seccion(c, todos.filter((p) => clave(p) === c).length));
      ul = grilla.lastElementChild.querySelector('.grilla');
    }
    ul.insertAdjacentHTML('beforeend', visibles.slice(i, j).map((p, k) => tarjeta(p, i + k)).join(''));
    i = j;
  }

  el('grilla-vacia').hidden = todos.length > 0;
  el('grilla-mas').hidden = visibles.length >= todos.length;
  el('grilla-mas').textContent = `Ver más productos (${todos.length - visibles.length})`;
  el('catalogo-busqueda').hidden = !estado.busqueda;
  el('catalogo-busqueda-texto').textContent = `"${estado.busqueda}"`;
  const nombre = filtros().find((f) => f.id === estado.filtro)?.nombre;
  el('catalogo-cuenta').textContent = estado.busqueda
    ? `${todos.length} ${todos.length === 1 ? 'producto encontrado' : 'productos encontrados'}`
    : estado.filtro === 'todos'
      ? `${todos.length} productos`
      : `${nombre} · ${todos.length} productos`;

  aparecer(grilla.querySelectorAll('.producto:not(.visible)'));
}

// Las tarjetas aparecen escalonadas a medida que entran en pantalla
export function aparecer(items) {
  if (!document.documentElement.classList.contains('con-movimiento')) {
    items.forEach((t) => t.classList.add('visible'));
    return;
  }
  observador ??= new IntersectionObserver(
    (entradas) =>
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        observador.unobserve(e.target);
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((t) => observador.observe(t));
}
