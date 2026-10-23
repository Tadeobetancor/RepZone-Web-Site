import { cargarCatalogo, formatoPrecio, miniatura } from '../datos.js';
import { carrito, lineas, mensajeWhatsApp, linkPedido, textoSabor, ruleta, totalPedido } from '../carrito.js';
import { cargarRuleta, ruletaActual } from '../ruleta-datos.js';
import { abrirPanel, cerrarPanel } from './panel.js';
import { abrirRuleta } from './ruleta.js';

// Carrito en dos pasos: 1) "Tu pedido" (productos, ruleta y total) → Confirmar compra
// 2) "Entrega" (envío o retiro, dirección y nombre) → Enviar pedido por WhatsApp
const el = (id) => document.getElementById(id);
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const CLAVE_DATOS = 'repzone-datos-pedido';
const TACHO = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>`;
const WA = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.34m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41"/></svg>`;
// ruedita de la ruleta (dibujada con CSS) para la tarjeta de la ruleta
const RUEDITA = '<span class="ruedita" aria-hidden="true"><span></span></span>';

let catalogo = [];
let paso = 'pedido';
// Datos de entrega: se recuerdan para el próximo pedido
let datos = { entrega: null, nombre: '', zona: '', domicilio: '' };
try {
  datos = { ...datos, ...JSON.parse(localStorage.getItem(CLAVE_DATOS) || '{}') };
} catch {}
const guardarDatos = () => {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  } catch {}
};

export async function iniciarCarrito() {
  const boton = el('carrito-btn');
  boton.addEventListener('click', abrir);
  addEventListener('abrir-carrito', abrir);
  carrito.escuchar(() => {
    contador();
    if (!el('carrito').hidden) pintar();
  });
  contador();
  catalogo = await cargarCatalogo();
  contador();
  cargarRuleta().then(() => !el('carrito').hidden && pintar());

  const panel = el('carrito');
  panel.addEventListener('click', (e) => {
    const b = e.target.closest(
      '[data-mas], [data-menos], [data-quitar], [data-quitar-ruleta], [data-ruleta], [data-entrega], [data-vaciar], [data-seguir], [data-confirmar], [data-volver]',
    );
    if (!b) return;
    if (b.dataset.mas) carrito.cambiar(Number(b.dataset.mas), carrito.items()[b.dataset.mas].cantidad + 1);
    if (b.dataset.menos) carrito.cambiar(Number(b.dataset.menos), carrito.items()[b.dataset.menos].cantidad - 1);
    if (b.dataset.quitar) quitar(b, () => carrito.quitar(Number(b.dataset.quitar)));
    if (b.hasAttribute('data-quitar-ruleta')) ruleta.quitarPendiente();
    // sin giros todavía: abre mostrando los posibles premios; con giros, directo a la rueda
    if (b.hasAttribute('data-ruleta')) abrirRuleta({ verPremios: !ruleta.cantidad() });
    if (b.dataset.entrega) {
      datos.entrega = b.dataset.entrega;
      guardarDatos();
      pintar();
    }
    if (b.hasAttribute('data-vaciar')) carrito.vaciar();
    if (b.hasAttribute('data-seguir')) {
      const vacio = !carrito.cantidad();
      cerrarPanel();
      if (vacio) setTimeout(() => el('productos').scrollIntoView({ behavior: 'smooth' }), 450);
    }
    if (b.hasAttribute('data-confirmar')) {
      // antes de pasar a la entrega, el giro comprado tiene que estar girado
      if (ruleta.pendientes()) return abrirRuleta();
      irA('entrega');
    }
    if (b.hasAttribute('data-volver')) irA('pedido');
  });
  panel.addEventListener('input', (e) => {
    const campo = e.target.dataset.campo;
    if (!campo) return;
    datos[campo] = e.target.value.slice(0, 80);
    guardarDatos();
    if (e.target.value.trim()) e.target.removeAttribute('aria-invalid');
    actualizarLink();
  });
}

function contador() {
  const n = carrito.cantidad();
  const c = el('carrito-contador');
  const antes = Number(c.textContent);
  c.hidden = n === 0;
  c.textContent = n;
  // con productos adentro el carrito titila, para que no se olvide de mandar el pedido
  el('carrito-btn').classList.toggle('con-items', n > 0);
  el('carrito-btn').setAttribute('aria-label', `Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`);
  if (n > antes) {
    el('carrito-btn').classList.remove('salto');
    void el('carrito-btn').offsetWidth;
    el('carrito-btn').classList.add('salto');
    // terminado el salto, vuelve a titilar
    setTimeout(() => el('carrito-btn').classList.remove('salto'), 550);
  }
}

function abrir() {
  paso = 'pedido';
  pintar();
  abrirPanel(el('carrito'));
}

function irA(nuevo) {
  const avanza = nuevo === 'entrega';
  paso = nuevo;
  pintar();
  el('carrito-cuerpo').scrollTo(0, 0);
  const contenido = el('carrito-cuerpo').firstElementChild;
  contenido?.classList.add(avanza ? 'paso-avanza' : 'paso-vuelve');
}

function quitar(boton, accion) {
  boton.closest('.linea').classList.add('saliendo');
  setTimeout(accion, 220);
}

// "Sabor: Chocolate", "Sabor: único", "1 kg · Sabor: Vainilla"
function detalleLinea(l) {
  const sabor = textoSabor(l.producto, l.sabor);
  const partes = [l.tamano, sabor && `Sabor: ${sabor}`].filter(Boolean);
  return partes.length ? `<span class="linea-detalle">${partes.map(escapar).join(' · ')}</span>` : '';
}

function pintar() {
  const ls = lineas(catalogo);
  const n = carrito.cantidad();
  el('carrito-cuenta').textContent = n ? `${n} ${n === 1 ? 'producto' : 'productos'}` : '';
  if (!ls.length && !ruleta.cantidad()) {
    paso = 'pedido';
    return pintarVacio();
  }
  el('carrito-titulo').textContent = paso === 'pedido' ? 'Tu pedido' : 'Entrega';
  el('carrito-pie').hidden = false;
  if (paso === 'pedido') pintarPedido(ls);
  else pintarEntrega(ls);
}

function pintarVacio() {
  el('carrito-titulo').textContent = 'Tu pedido';
  el('carrito-cuerpo').innerHTML = `
    <div class="carrito-vacio" data-entra>
      <span class="carrito-vacio-icono"><svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg></span>
      <p><b>Tu carrito está vacío</b></p>
      <p>Sumá productos y mandá tu pedido por WhatsApp en un toque.</p>
      <button type="button" class="btn" data-seguir data-foco>Ver productos</button>
    </div>`;
  el('carrito-pie').innerHTML = '';
  el('carrito-pie').hidden = true;
}

const pasos = () => `
  <ol class="carrito-pasos" aria-label="Pasos de la compra">
    <li${paso === 'pedido' ? ' aria-current="step"' : ' class="hecho"'}><span>1</span>Tu pedido</li>
    <li${paso === 'entrega' ? ' aria-current="step"' : ''}><span>2</span>Entrega</li>
  </ol>`;

// ---------- Paso 1: el pedido ----------
function lineaProducto(l) {
  return `
    <li class="linea" data-entra>
      <img src="${miniatura(l.producto.fotos[0])}" alt="" decoding="async">
      <div class="linea-info">
        <span class="producto-marca">${escapar(l.producto.marca)}</span>
        <span class="linea-nombre">${escapar(l.producto.nombre)}</span>
        ${detalleLinea(l)}
        <div class="linea-abajo">
          <div class="cantidad cantidad-chica" role="group" aria-label="Cantidad de ${escapar(l.producto.nombre)}">
            <button type="button" data-menos="${l.indice}" aria-label="Restar uno" ${l.cantidad <= 1 ? 'disabled' : ''}>−</button>
            <output>${l.cantidad}</output>
            <button type="button" data-mas="${l.indice}" aria-label="Sumar uno">+</button>
          </div>
          <b class="linea-precio">${formatoPrecio(l.subtotal)}</b>
        </div>
      </div>
      <button type="button" class="linea-quitar" data-quitar="${l.indice}" aria-label="Quitar ${escapar(l.producto.nombre)}">${TACHO}</button>
    </li>`;
}

const REGALO = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4"/></svg>`;

// Tarjeta de la ruleta, debajo de los productos: invita a ver los premios y, una vez que se giró,
// muestra los giros, su costo y todos los premios que tocaron (con su código).
// Con la ruleta desactivada en la planilla no aparece (salvo que ya haya giros en el pedido).
function tarjetaRuleta() {
  const n = ruleta.cantidad();
  const pendientes = ruleta.pendientes();
  const premios = ruleta.premios();
  if (!ruletaActual.activa && !n) return '';
  const boton = pendientes ? '¡Girar!' : n ? (ruletaActual.activa ? 'Otra vez' : '') : 'Ver posibles premios';
  return `
    <div class="ruleta-promo${premios.length ? ' con-premios' : ''}" data-entra>
      <div class="ruleta-promo-cabeza">
        ${RUEDITA}
        <div class="ruleta-promo-texto">
          <b>Ruleta RepZone</b>
          <span>${
            n
              ? `${n} ${n === 1 ? 'giro' : 'giros'} · <b>${formatoPrecio(n * ruletaActual.precio)}</b>`
              : `Sumá un giro por ${formatoPrecio(ruletaActual.precio)} y llevate un premio seguro.`
          }</span>
        </div>
        ${boton ? `<button type="button" class="ruleta-promo-btn${n ? '' : ' ver-premios'}" data-ruleta>${boton}</button>` : ''}
      </div>
      ${
        premios.length
          ? `<p class="ruleta-premios-titulo">${premios.length === 1 ? 'Te tocó' : 'Te tocaron'}</p>
        <ul class="ruleta-premios">${premios
          .map(
            (p) => `<li><span class="ruleta-premios-foto">${p.foto ? `<img src="${escapar(miniatura(p.foto))}" alt="">` : REGALO}</span>
              <span class="ruleta-premios-texto"><b>${escapar(p.nombre)}</b><small>${escapar(p.marca)}</small></span>
              ${p.codigo ? `<span class="ruleta-premios-codigo">${escapar(p.codigo)}</span>` : ''}</li>`,
          )
          .join('')}</ul>`
          : ''
      }
      ${
        pendientes
          ? `<div class="ruleta-pendiente"><span>${pendientes === 1 ? 'Tenés 1 giro sin girar' : `Tenés ${pendientes} giros sin girar`}</span>
             <button type="button" data-quitar-ruleta>Quitar</button></div>`
          : ''
      }
    </div>`;
}

function pintarPedido(ls) {
  el('carrito-cuerpo').innerHTML = `
    <div class="carrito-paso">
      ${pasos()}
      <ul class="lineas">${ls.map(lineaProducto).join('')}</ul>
      ${tarjetaRuleta()}
      <button type="button" class="carrito-seguir" data-seguir>+ Seguir sumando productos</button>
    </div>`;
  const falta = ruleta.pendientes() > 0;
  el('carrito-pie').innerHTML = `
    <div class="carrito-total"><span>Total</span><b>${formatoPrecio(totalPedido(ls))}</b></div>
    <button type="button" class="btn btn-confirmar${falta ? ' falta' : ''}" data-confirmar>
      ${falta ? 'Girá la ruleta para seguir' : 'Confirmar compra'}
      <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>
    <button type="button" class="carrito-vaciar" data-vaciar>Vaciar carrito</button>`;
}

// ---------- Paso 2: la entrega ----------
function pintarEntrega(ls) {
  const n = carrito.cantidad();
  el('carrito-cuerpo').innerHTML = `
    <div class="carrito-paso">
      ${pasos()}
      <div class="carrito-entrega">
        <button type="button" class="carrito-volver" data-volver>
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
          Volver al pedido <small>(${n} ${n === 1 ? 'producto' : 'productos'})</small>
        </button>
        <fieldset class="entrega">
          <legend class="ficha-sub">¿Cómo lo recibís?</legend>
          <div class="entrega-opciones">
            <button type="button" class="entrega-opcion" data-entrega="envio" aria-pressed="${datos.entrega === 'envio'}">
              <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
              <b>Envío</b><small>Gratis en Hurlingham. Al resto, te lo cotizamos por WhatsApp</small>
            </button>
            <button type="button" class="entrega-opcion" data-entrega="retiro" aria-pressed="${datos.entrega === 'retiro'}">
              <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
              <b>Retiro</b><small>Retirá en nuestro centro de distribución</small>
            </button>
          </div>
        </fieldset>
        <div class="carrito-campos">
          ${
            datos.entrega === 'envio'
              ? `<label><span>Barrio o localidad</span><input type="text" data-campo="zona" value="${escapar(datos.zona)}" autocomplete="address-level2" maxlength="80" required placeholder="Ej: Villa Tesei"></label>
          <label><span>Domicilio</span><input type="text" data-campo="domicilio" value="${escapar(datos.domicilio)}" autocomplete="street-address" maxlength="80" required placeholder="Calle, número, piso o depto"></label>`
              : ''
          }
          <label><span>Tu nombre <small>(opcional)</small></span><input type="text" data-campo="nombre" value="${escapar(datos.nombre)}" autocomplete="given-name" maxlength="80"></label>
        </div>
      </div>
    </div>`;
  el('carrito-pie').innerHTML = `
    <div class="carrito-total"><span>Total</span><b>${formatoPrecio(totalPedido(ls))}</b></div>
    <a class="btn btn-wa" id="carrito-enviar" target="_blank" rel="noopener">${WA}<span id="carrito-enviar-texto"></span></a>`;
  el('carrito-enviar').addEventListener('click', (e) => {
    if (listo()) return;
    e.preventDefault();
    if (ruleta.pendientes()) return abrirRuleta();
    if (!datos.entrega) return sacudir(el('carrito').querySelector('.entrega'));
    // con envío: se marcan los datos de la dirección que faltan y se va al primero
    const vacios = faltanDireccion().map((c) => el('carrito').querySelector(`[data-campo="${c}"]`));
    vacios.forEach((i) => i.setAttribute('aria-invalid', 'true'));
    sacudir(vacios[0].closest('label'));
    vacios[0].focus({ preventScroll: true });
  });
  actualizarLink();
}

function sacudir(f) {
  f.classList.remove('sacudir');
  void f.offsetWidth;
  f.classList.add('sacudir');
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Con envío hacen falta barrio o localidad y domicilio
const faltanDireccion = () => (datos.entrega === 'envio' ? ['zona', 'domicilio'].filter((c) => !datos[c].trim()) : []);
const listo = () => Boolean(datos.entrega) && !faltanDireccion().length && !ruleta.pendientes();

function actualizarLink() {
  const enviar = el('carrito-enviar');
  if (!enviar) return;
  const ok = listo();
  enviar.classList.toggle('falta', !ok);
  el('carrito-enviar-texto').textContent = ok
    ? 'Enviar pedido por WhatsApp'
    : ruleta.pendientes()
      ? 'Girá la ruleta antes de enviar'
      : !datos.entrega
        ? 'Elegí envío o retiro'
        : 'Completá barrio y domicilio';
  enviar.href = ok ? linkPedido(mensajeWhatsApp(lineas(catalogo), datos)) : '#';
}
