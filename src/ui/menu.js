import { desplegar, plegar } from './despliegue.js';
import { CATEGORIAS } from '../config.js';

const flecha = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

// Los dos ganchos comerciales: tarjetas propias, bien distintas al resto del menú
const GANCHOS = [
  { id: 'combos', href: '#combos', clase: 'gancho-combos', etiqueta: 'Más por menos', titulo: 'Combos', bajada: 'Packs armados para ahorrar' },
  { id: 'ofertas', href: '#ofertas', clase: 'gancho-ofertas', etiqueta: 'Ofertas flash', titulo: 'Ofertas', bajada: 'Precios que no duran' },
];

export function iniciarMenu() {
  const raiz = document.documentElement;
  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('menu');
  const contenido = menu.querySelector('.menu-contenido');

  document.getElementById('menu-ganchos').innerHTML = GANCHOS.map(
    (g) => `
      <a class="gancho ${g.clase}" href="${g.href}">
        <span class="gancho-etiqueta" data-etiqueta="${g.id}">${g.etiqueta}</span>
        <span class="gancho-titulo">${g.titulo}</span>
        <span class="gancho-bajada">${g.bajada}</span>
        <span class="gancho-flecha">${flecha}</span>
      </a>`,
  ).join('');

  const categorias = [{ id: '', nombre: 'Todos los productos' }, ...CATEGORIAS];
  document.getElementById('menu-categorias').innerHTML = categorias
    .map(
      (c) => `
      <li${c.id ? '' : ' class="menu-cat-todos"'}>
        <a class="menu-cat" href="${c.id ? `#categoria/${c.id}` : '#productos'}"><span>${c.nombre}</span>${flecha}</a>
      </li>`,
    )
    .join('');

  let abierto = false;
  let anim;

  const abrir = () => {
    abierto = true;
    menu.hidden = false;
    raiz.classList.add('menu-abierto');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    contenido.scrollTop = 0;
    anim?.kill();
    anim = desplegar(menu, menu.querySelectorAll('.gancho, .menu-subtitulo, .menu-cat'));
    menu.querySelector('.gancho').focus({ preventScroll: true });
  };

  const cerrar = ({ devolverFoco = true, luego } = {}) => {
    abierto = false;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    anim?.kill();
    anim = plegar(menu, () => {
      menu.hidden = true;
      raiz.classList.remove('menu-abierto');
      luego?.();
    });
    if (devolverFoco) btn.focus({ preventScroll: true });
  };

  btn.addEventListener('click', () => (abierto ? cerrar() : abrir()));

  // Al tocar un link: cerrar y recién después navegar (con el menú abierto la página no scrollea)
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const destino = link.getAttribute('href');
    cerrar({
      devolverFoco: false,
      luego: () => (location.hash === destino ? dispatchEvent(new HashChangeEvent('hashchange')) : (location.hash = destino)),
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!abierto) return;
    if (e.key === 'Escape') cerrar();
    if (e.key === 'Tab') {
      // Mantener el foco entre el botón del menú y los links
      const enfocables = [btn, ...menu.querySelectorAll('a[href]')];
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }
  });
}
