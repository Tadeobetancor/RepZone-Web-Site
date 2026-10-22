import { CATEGORIAS, CLIENTES, DESDE_CERO, INSTAGRAM } from '../config.js';

const IG = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>`;
const CAMARA = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;

const ESTRELLAS = '<span class="cliente-estrellas" aria-hidden="true">★★★★★</span>';

// Carrusel de clientes: fotos con marco y estrellas; se duplica la tira para que corra sin cortes
function clientes() {
  const fotos = CLIENTES.length
    ? CLIENTES.map(
        (f) => `<figure class="cliente"><img src="/clientes/${f}" alt="Cliente de RepZone con su pedido" loading="lazy" decoding="async">
          <figcaption>${ESTRELLAS}</figcaption></figure>`,
      )
    : // sin fotos todavía: tarjetas que invitan a etiquetar a la cuenta
      Array.from({ length: 6 }, (_, i) => `<figure class="cliente cliente-vacio tono-${i % 3}">${CAMARA}<figcaption>Tu foto<br>acá</figcaption></figure>`);
  const tira = fotos.join('');
  // la segunda copia es solo para el efecto continuo: se oculta a lectores de pantalla
  return `<div class="clientes-pista"><div class="clientes-tramo">${tira}</div><div class="clientes-tramo" aria-hidden="true">${tira}</div></div>`;
}

export function iniciarPie() {
  const anio = new Date().getFullYear();
  document.getElementById('pie').innerHTML = `
    <section class="clientes" aria-labelledby="clientes-titulo">
      <div class="contenedor">
        <p class="etiqueta">Comunidad RepZone</p>
        <h2 class="titulo-seccion" id="clientes-titulo">Los que <span class="rojo">entrenan</span> con nosotros</h2>
      </div>
      <div class="clientes-carrusel">${clientes()}</div>
      <div class="clientes-accion">
        <a class="btn btn-claro clientes-ig" href="${INSTAGRAM}" target="_blank" rel="noopener">${IG}<span>Etiquetanos en @repzone.arg</span></a>
      </div>
    </section>

    <div class="contenedor pie-cuerpo">
      <img class="pie-logo" src="/logo-repzone.png" alt="RepZone" width="960" height="398" loading="lazy">
      <nav aria-label="Categorías">
        <ul class="pie-links">
          <li><a href="#combos">Combos</a></li>
          <li><a href="#ofertas">Ofertas</a></li>
          ${CATEGORIAS.map((c) => `<li><a href="#categoria/${c.id}">${c.nombre}</a></li>`).join('')}
        </ul>
      </nav>
    </div>

    <div class="pie-final">
      <div class="contenedor pie-final-fila">
        <p class="pie-legal">© ${anio} RepZone. Precios en pesos argentinos, sujetos a cambios.</p>
        <p class="desdecero">
          <span class="desdecero-rotulo">Diseño web</span>
          <a class="desdecero-logo" href="${DESDE_CERO.instagramAgencia}" target="_blank" rel="noopener" aria-label="Desde Cero en Instagram">
            <img src="/${DESDE_CERO.logo}" alt="Desde Cero" width="520" height="286" loading="lazy">
          </a>
          <a class="desdecero-ig" href="${DESDE_CERO.instagram}" target="_blank" rel="noopener">${DESDE_CERO.usuario}</a>
        </p>
      </div>
    </div>`;
}
