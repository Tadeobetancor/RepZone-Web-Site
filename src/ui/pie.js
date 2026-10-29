import { CATEGORIAS, CLIENTES, DESDE_CERO, INSTAGRAM, REELS, linkWhatsApp } from '../config.js';

const IG = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>`;
const CAMARA = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;

const ESTRELLAS = '<span class="cliente-estrellas" aria-hidden="true">★★★★★</span>';

// Carrusel de clientes: fotos con marco y estrellas. La tira corre sola, despacio, y además se puede
// arrastrar con el dedo (o el mouse) para mirarla al ritmo de cada uno; al soltarla sigue sola.
// Va duplicada para que corra sin cortes (la copia se oculta a lectores de pantalla).
function clientes() {
  const fotos = CLIENTES.length
    ? CLIENTES.map(
        (f) => `<figure class="cliente"><img src="/clientes/${f}" alt="Cliente de RepZone con su pedido" loading="lazy" decoding="async" draggable="false">
          <figcaption>${ESTRELLAS}</figcaption></figure>`,
      )
    : // sin fotos todavía: tarjetas que invitan a etiquetar a la cuenta
      Array.from({ length: 6 }, (_, i) => `<figure class="cliente cliente-vacio tono-${i % 3}">${CAMARA}<figcaption>Tu foto<br>acá</figcaption></figure>`);
  const tira = fotos.join('');
  return `<div class="clientes-pista"><div class="clientes-tramo">${tira}</div><div class="clientes-tramo" aria-hidden="true">${tira}</div></div>`;
}

// Invitación a la comunidad, debajo de las fotos: caritas de clientes, el texto y el ícono de Instagram.
// Toda la tarjeta lleva a la cuenta.
function comunidad() {
  const caras = CLIENTES.slice(0, 3)
    .map((f) => `<img src="/clientes/${f}" alt="" loading="lazy" decoding="async">`)
    .join('');
  return `
    <a class="comunidad" href="${INSTAGRAM}" target="_blank" rel="noopener">
      ${caras ? `<span class="comunidad-caras" aria-hidden="true">${caras}</span>` : ''}
      <span class="comunidad-texto">
        <b>Unite a la comunidad</b>
        <small>Etiquetanos y aparecé acá</small>
      </span>
      <span class="comunidad-ig">${IG}</span>
    </a>`;
}

const VUELTA_SEGUNDOS = 70; // lo que tarda la tira en dar una vuelta entera sola

function iniciarCarruselClientes() {
  const caja = document.querySelector('.clientes-carrusel');
  const pista = caja?.querySelector('.clientes-pista');
  if (!pista) return;
  const solo = document.documentElement.classList.contains('con-movimiento');
  let x = 0; // corrimiento en px (negativo = hacia la izquierda)
  let ancho = 0; // ancho de un tramo: al recorrerlo entero se vuelve a 0 sin que se note
  let visible = false;
  let mouseEncima = false;
  let arrastre = null; // { inicio, desde, ultimoX, ultimoT, velocidad }
  let inercia = 0; // px/s que quedan del arrastre al soltar
  let previo = 0;

  const medir = () => (ancho = pista.firstElementChild.getBoundingClientRect().width);
  const dar = () => {
    if (ancho) x = ((x % ancho) - ancho) % ancho;
    pista.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const cuadro = (t) => {
    const dt = Math.min(0.05, (t - previo) / 1000 || 0);
    previo = t;
    if (!arrastre) {
      if (Math.abs(inercia) > 5) {
        x += inercia * dt;
        inercia *= Math.pow(0.04, dt); // se frena en ~1 s
      } else if (solo && !mouseEncima) {
        inercia = 0;
        x -= (ancho / VUELTA_SEGUNDOS) * dt;
      }
      dar();
    }
    if (visible) requestAnimationFrame(cuadro);
  };
  const arrancar = () => {
    previo = performance.now();
    requestAnimationFrame(cuadro);
  };

  // arrastrar: solo lo horizontal; lo vertical sigue moviendo la página (touch-action: pan-y)
  pista.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    arrastre = { inicio: e.clientX, desde: x, ultimoX: e.clientX, ultimoT: e.timeStamp, velocidad: 0 };
    inercia = 0;
    pista.setPointerCapture(e.pointerId);
    caja.classList.add('arrastrando');
  });
  pista.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dt = (e.timeStamp - arrastre.ultimoT) / 1000;
    if (dt > 0) arrastre.velocidad = (e.clientX - arrastre.ultimoX) / dt;
    arrastre.ultimoX = e.clientX;
    arrastre.ultimoT = e.timeStamp;
    x = arrastre.desde + (e.clientX - arrastre.inicio);
    dar();
  });
  const soltar = (e) => {
    if (!arrastre) return;
    // si el dedo quedó quieto un rato antes de soltar, no hay envión
    inercia = e.timeStamp - arrastre.ultimoT < 80 ? Math.max(-2500, Math.min(2500, arrastre.velocidad)) : 0;
    arrastre = null;
    caja.classList.remove('arrastrando');
  };
  pista.addEventListener('pointerup', soltar);
  pista.addEventListener('pointercancel', soltar);
  caja.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (mouseEncima = true));
  caja.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && (mouseEncima = false));

  addEventListener('resize', () => (medir(), dar()));
  // solo trabaja mientras se ve (el pie además se dibuja recién al acercarse)
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) {
      medir();
      arrancar();
    }
  }).observe(caja);
}

// Reels de Instagram: el reproductor oficial de cada publicación, en una fila que se desliza.
// Se cargan recién cuando la sección se acerca a la pantalla.
function reels() {
  const lista = REELS.map((url) => url.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/)).filter(Boolean);
  if (!lista.length) return '';
  return `
    <section class="reels" aria-labelledby="reels-titulo">
      <div class="contenedor">
        <p class="etiqueta">Instagram</p>
        <h2 class="titulo-seccion" id="reels-titulo">Lo último en <span class="rojo">@repzone.arg</span></h2>
      </div>
      <div class="reels-pista">
        ${lista
          .map(
            ([, tipo, codigo], i) => `<div class="reel">
              <iframe src="https://www.instagram.com/${tipo}/${codigo}/embed/" title="Publicación ${i + 1} de Instagram de RepZone"
                loading="lazy" scrolling="no" allowtransparency="true" allow="encrypted-media; fullscreen"></iframe>
            </div>`,
          )
          .join('')}
      </div>
    </section>`;
}

// El reproductor de Instagram avisa su alto con un mensaje: cada marco se ajusta a su publicación
function ajustarReels() {
  addEventListener('message', (e) => {
    if (e.origin !== 'https://www.instagram.com') return;
    let datos;
    try {
      datos = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch {
      return;
    }
    if (datos?.type !== 'MEASURE' || !datos.details?.height) return;
    const marco = [...document.querySelectorAll('.reel iframe')].find((f) => f.contentWindow === e.source);
    if (marco) marco.style.height = `${Math.ceil(datos.details.height)}px`;
  });
}

export function iniciarPie() {
  const anio = new Date().getFullYear();
  ajustarReels();
  document.getElementById('pie').innerHTML = `
    ${reels()}
    <section class="clientes" aria-labelledby="clientes-titulo">
      <div class="contenedor">
        <p class="etiqueta">Comunidad RepZone</p>
        <h2 class="titulo-seccion" id="clientes-titulo">Los que <span class="rojo">entrenan</span> con nosotros</h2>
      </div>
      <div class="clientes-carrusel">${clientes()}</div>
      <div class="clientes-accion">${comunidad()}</div>
    </section>

    <div class="pie-mapa">
      <div class="contenedor pie-cuerpo">
        <div class="pie-marca">
          <img class="pie-logo" src="/logo-repzone.png" alt="RepZone" width="960" height="398" loading="lazy">
          <p>Suplementos deportivos. Envío gratis en Hurlingham.</p>
        </div>
        <nav class="pie-columnas" aria-label="Pie de página">
          <div class="pie-columna pie-columna-categorias">
            <h3>Categorías</h3>
            <ul>${CATEGORIAS.map((c) => `<li><a href="#categoria/${c.id}">${c.nombre}</a></li>`).join('')}</ul>
          </div>
          <div class="pie-columna">
            <h3>Tienda</h3>
            <ul>
              <li><a href="#productos">Catálogo completo</a></li>
              <li><a href="#combos">Combos</a></li>
              <li><a href="#ofertas">Ofertas</a></li>
            </ul>
          </div>
          <div class="pie-columna">
            <h3>Contacto</h3>
            <ul>
              <li><a href="${linkWhatsApp()}" target="_blank" rel="noopener">WhatsApp</a></li>
              <li><a href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram</a></li>
            </ul>
          </div>
        </nav>
      </div>
    </div>

    <div class="pie-final">
      <div class="contenedor pie-final-fila">
        <p class="pie-legal">© ${anio} RepZone. Precios en pesos argentinos, sujetos a cambios.</p>
        <a class="desdecero" href="${DESDE_CERO.instagram}" target="_blank" rel="noopener">
          <img src="/${DESDE_CERO.logo}" alt="Desde Cero" width="520" height="286" loading="lazy">
          <span class="desdecero-texto">
            <span class="desdecero-rotulo">Diseño web</span>
            <span class="desdecero-ig">${DESDE_CERO.usuario}</span>
          </span>
        </a>
      </div>
    </div>`;
  iniciarCarruselClientes();
}
