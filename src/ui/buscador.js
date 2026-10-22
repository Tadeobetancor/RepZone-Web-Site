import { cargarCatalogo, buscar, formatoPrecio, miniatura } from '../datos.js';
import { aplicar } from './grilla.js';

const MAX_RESULTADOS = 6;

// Buscador de la barra: resultados en vivo debajo, Enter muestra todo en la grilla
export function iniciarBuscador() {
  const barra = document.getElementById('barra');
  const form = document.getElementById('buscador');
  const input = document.getElementById('buscar');
  const panel = document.getElementById('buscador-panel');
  const abrirBtn = document.getElementById('buscar-btn');
  const cerrarBtn = document.getElementById('buscador-cerrar');
  let catalogo = [];
  let resultados = [];
  let elegido = -1;
  cargarCatalogo().then((c) => (catalogo = c));

  // Celular: la lupa despliega el campo a todo el ancho de la barra
  abrirBtn.addEventListener('click', () => {
    barra.classList.add('buscando');
    input.focus();
  });

  const ocultarPanel = () => {
    panel.hidden = true;
    elegido = -1;
    input.removeAttribute('aria-activedescendant');
  };

  const cerrar = () => {
    input.value = '';
    ocultarPanel();
    if (barra.classList.contains('buscando')) {
      barra.classList.remove('buscando');
      abrirBtn.focus();
    } else {
      input.blur();
    }
  };

  const verTodo = () => {
    const texto = input.value.trim();
    if (!texto) return;
    ocultarPanel();
    input.blur();
    barra.classList.remove('buscando');
    aplicar({ busqueda: texto }, { desplazar: true });
  };

  // elegir un resultado abre directo su ficha
  const irA = (p) => {
    ocultarPanel();
    input.blur();
    barra.classList.remove('buscando');
    dispatchEvent(new CustomEvent('abrir-producto', { detail: p.id }));
  };

  const mostrar = () => {
    const texto = input.value.trim();
    if (!texto) return ocultarPanel();
    resultados = buscar(catalogo, texto);
    elegido = -1;
    if (!resultados.length) {
      panel.innerHTML = `<p class="buscador-nada">No encontramos <b>"${texto.replace(/[<>&"]/g, '')}"</b>. Probá con otra marca o producto.</p>`;
    } else {
      panel.innerHTML =
        resultados
          .slice(0, MAX_RESULTADOS)
          .map(
            (p, i) => `
          <button type="button" class="resultado" id="resultado-${i}" role="option" data-i="${i}">
            <img src="${miniatura(p.fotos[0])}" alt="" loading="lazy" decoding="async">
            <span class="resultado-texto"><small>${p.marca}</small><span>${p.nombre}</span></span>
            <b>${formatoPrecio(p.precio)}</b>
          </button>`,
          )
          .join('') +
        `<button type="button" class="resultado-todos" data-todos>Ver ${resultados.length === 1 ? 'el resultado' : `los ${resultados.length} resultados`} en el catálogo</button>`;
    }
    panel.hidden = false;
  };

  let espera;
  input.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(mostrar, 120);
  });
  input.addEventListener('focus', () => input.value.trim() && mostrar());

  // Elegir con el mouse/dedo (pointerdown: antes de que el input pierda el foco)
  panel.addEventListener('pointerdown', (e) => e.preventDefault());
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-todos')) verTodo();
    else irA(resultados[Number(b.dataset.i)]);
  });

  // Teclado: flechas para moverse, Enter para ir, Escape para cerrar
  input.addEventListener('keydown', (e) => {
    const opciones = [...panel.querySelectorAll('.resultado')];
    if (e.key === 'Escape') return cerrar();
    if (!opciones.length || panel.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      elegido = (elegido + (e.key === 'ArrowDown' ? 1 : -1) + opciones.length) % opciones.length;
      opciones.forEach((o, i) => o.classList.toggle('activo', i === elegido));
      input.setAttribute('aria-activedescendant', opciones[elegido].id);
    }
  });

  input.addEventListener('blur', () => setTimeout(ocultarPanel, 150));
  cerrarBtn.addEventListener('click', cerrar);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (elegido >= 0) irA(resultados[elegido]);
    else verTodo();
  });
}
