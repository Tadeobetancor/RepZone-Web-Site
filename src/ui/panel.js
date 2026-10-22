import { gsap } from 'gsap';
import { desplegar, plegar } from './despliegue.js';

// Paneles (ficha de producto y carrito): se despliegan como una página que baja,
// se cierran con la X, tocando afuera, con Escape o con el botón "atrás" del celular.
const raiz = document.documentElement;
let actual = null;
let empujado = false;
let focoPrevio = null;

const enfocables = (el) =>
  [...el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter(
    (e) => e.offsetParent !== null,
  );

function mostrar(panel) {
  actual = panel;
  panel.hidden = false;
  raiz.classList.add('panel-abierto');
  const hoja = panel.querySelector('.panel-hoja');
  panel.querySelector('.panel-cuerpo')?.scrollTo(0, 0);
  gsap.fromTo(panel.querySelector('.panel-fondo'), { opacity: 0 }, { opacity: 1, duration: 0.35 });
  desplegar(hoja, hoja.querySelectorAll('[data-entra]'));
  document.getElementById('aviso')?.classList.remove('visible');
  // el foco va a la hoja (así los lectores de pantalla la anuncian) sin marcar ningún botón
  const foco = panel.querySelector('.panel-cuerpo [data-foco]') || panel.querySelector('[data-foco]') || enfocables(hoja)[0];
  requestAnimationFrame(() => foco?.focus({ preventScroll: true }));
}

function ocultar(panel, { rapido = false } = {}) {
  if (actual === panel) actual = null;
  const fin = () => {
    panel.hidden = true;
    if (!actual) raiz.classList.remove('panel-abierto');
  };
  if (rapido) {
    gsap.killTweensOf(panel.querySelectorAll('*'));
    fin();
  } else {
    gsap.to(panel.querySelector('.panel-fondo'), { opacity: 0, duration: 0.35 });
    plegar(panel.querySelector('.panel-hoja'), fin);
  }
  if (!actual) focoPrevio?.focus?.({ preventScroll: true });
}

export function abrirPanel(panel, { url } = {}) {
  if (actual === panel) return;
  if (actual) {
    // pasar de un panel a otro (ej. de la ficha al carrito) sin sumar pasos al "atrás"
    ocultar(actual, { rapido: true });
    history.replaceState({ panel: panel.id }, '', url ?? location.href);
  } else {
    focoPrevio = document.activeElement;
    // marca la página de abajo: al volver con "atrás" el catálogo no se reacomoda
    history.replaceState({ ...(history.state || {}), volviendoDePanel: true }, '');
    history.pushState({ panel: panel.id }, '', url ?? location.href);
    empujado = true;
  }
  mostrar(panel);
}

// Para abrir sin tocar el historial (ej. al entrar directo con el link de un producto)
export function abrirPanelDirecto(panel) {
  focoPrevio = document.activeElement;
  empujado = false;
  mostrar(panel);
}

export function cerrarPanel() {
  if (!actual) return;
  if (empujado) {
    history.back();
  } else {
    ocultar(actual);
    if (location.hash.startsWith('#p/')) history.replaceState(null, '', location.pathname + location.search);
  }
}

export const panelAbierto = () => actual;

addEventListener('popstate', () => {
  if (actual && history.state?.panel !== actual.id) {
    empujado = false;
    ocultar(actual);
  }
  setTimeout(() => {
    if (history.state?.volviendoDePanel) {
      const { volviendoDePanel, ...resto } = history.state;
      history.replaceState(Object.keys(resto).length ? resto : null, '');
    }
  }, 80);
});

document.addEventListener('click', (e) => {
  if (actual && e.target.closest('[data-cerrar]') && actual.contains(e.target)) cerrarPanel();
});

document.addEventListener('keydown', (e) => {
  if (!actual) return;
  if (e.key === 'Escape') cerrarPanel();
  if (e.key === 'Tab') {
    const lista = enfocables(actual.querySelector('.panel-hoja'));
    if (!lista.length) return;
    const [primero, ultimo] = [lista[0], lista[lista.length - 1]];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }
});
