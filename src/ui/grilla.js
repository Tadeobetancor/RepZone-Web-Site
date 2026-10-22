import { cargarCatalogo, formatoPrecio, descuento, buscar, miniatura, fotoAdaptable } from '../datos.js';
import { CATEGORIAS } from '../config.js';

const POR_PAGINA = 24;
const fuego = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`;
const paquete = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5zM3.4 11.3 2 12l10 5 10-5-1.4-.7L12 14.6l-8.6-3.3zm0 5L2 17l10 5 10-5-1.4-.7L12 19.6l-8.6-3.3z"/></svg>`;
const rayo = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>`;

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
        ${f.id === 'ofertas' ? rayo : f.id === 'combos' ? paquete : ''}<span>${f.nombre}</span><small>${conteo(f)}</small></button>`,
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

// "Todos": primero tendencias y ofertas, después el resto mezclado por categoría.
// Las tendencias (tarjetas dobles) se reparten cada pocas tarjetas para que la grilla respire.
const CADA = 5;
function ordenar(lista) {
  const tendencias = lista.filter((p) => p.tendencia);
  const ofertas = lista.filter((p) => p.oferta && !p.tendencia);
  const resto = lista.filter((p) => !p.tendencia && !p.oferta);
  const grupos = {};
  resto.forEach((p) => (grupos[p.categoria] ??= []).push(p));
  const colas = Object.values(grupos);
  const mezclado = [];
  for (let i = 0; mezclado.length < resto.length; i++) colas.forEach((c) => c[i] && mezclado.push(c[i]));
  const simples = [...ofertas, ...mezclado];
  const final = [];
  while (tendencias.length || simples.length) {
    if (tendencias.length) final.push(tendencias.shift());
    final.push(...simples.splice(0, CADA - 1));
  }
  return final;
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

function pintar({ desde = 0 } = {}) {
  const todos = lista().filter((p) => p.precio && p.fotos.length);
  const visibles = todos.slice(0, estado.mostrados);
  const grilla = el('grilla');
  const html = visibles.slice(desde).map((p, i) => tarjeta(p, desde + i)).join('');
  if (desde) grilla.insertAdjacentHTML('beforeend', html);
  else grilla.innerHTML = html;

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
