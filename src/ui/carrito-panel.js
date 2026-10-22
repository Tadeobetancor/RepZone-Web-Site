import { cargarCatalogo, formatoPrecio } from '../datos.js';
import { carrito, lineas, mensajeWhatsApp, linkPedido, textoSabor } from '../carrito.js';
import { abrirPanel, cerrarPanel } from './panel.js';

const el = (id) => document.getElementById(id);
const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const CLAVE_DATOS = 'repzone-datos-pedido';

let catalogo = [];
// Datos de entrega: se recuerdan para el próximo pedido
let datos = { entrega: null, nombre: '', zona: '' };
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
    if (!el('carrito').hidden) pintarLista();
  });
  contador();
  catalogo = await cargarCatalogo();
  contador();

  const panel = el('carrito');
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mas], [data-menos], [data-quitar], [data-entrega], [data-vaciar], [data-seguir]');
    if (!b) return;
    if (b.dataset.mas) carrito.cambiar(Number(b.dataset.mas), carrito.items()[b.dataset.mas].cantidad + 1);
    if (b.dataset.menos) carrito.cambiar(Number(b.dataset.menos), carrito.items()[b.dataset.menos].cantidad - 1);
    if (b.dataset.quitar) quitar(b);
    if (b.dataset.entrega) {
      datos.entrega = b.dataset.entrega;
      guardarDatos();
      pintarPie();
    }
    if (b.hasAttribute('data-vaciar')) carrito.vaciar();
    if (b.hasAttribute('data-seguir')) {
      const vacio = !carrito.items().length;
      cerrarPanel();
      if (vacio) setTimeout(() => el('productos').scrollIntoView({ behavior: 'smooth' }), 450);
    }
  });
  panel.addEventListener('input', (e) => {
    const campo = e.target.dataset.campo;
    if (!campo) return;
    datos[campo] = e.target.value.slice(0, 60);
    guardarDatos();
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
  pintarLista();
  abrirPanel(el('carrito'));
}

function quitar(boton) {
  const fila = boton.closest('.linea');
  fila.classList.add('saliendo');
  setTimeout(() => carrito.quitar(Number(boton.dataset.quitar)), 220);
}

// "Sabor: Chocolate", "Sabor: único", "1 kg · Sabor: Vainilla"
function detalleLinea(l) {
  const sabor = textoSabor(l.producto, l.sabor);
  const partes = [l.tamano, sabor && `Sabor: ${sabor}`].filter(Boolean);
  return partes.length ? `<span class="linea-detalle">${partes.map(escapar).join(' · ')}</span>` : '';
}

function pintarLista() {
  const ls = lineas(catalogo);
  const n = ls.reduce((s, l) => s + l.cantidad, 0);
  el('carrito-cuenta').textContent = n ? `${n} ${n === 1 ? 'producto' : 'productos'}` : '';
  if (!ls.length) {
    el('carrito-cuerpo').innerHTML = `
      <div class="carrito-vacio" data-entra>
        <span class="carrito-vacio-icono"><svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg></span>
        <p><b>Tu carrito está vacío</b></p>
        <p>Sumá productos y mandá tu pedido por WhatsApp en un toque.</p>
        <button type="button" class="btn" data-seguir data-foco>Ver productos</button>
      </div>`;
    el('carrito-pie').innerHTML = '';
    el('carrito-pie').hidden = true;
    return;
  }
  el('carrito-cuerpo').innerHTML = `<ul class="lineas">${ls
    .map(
      (l) => `
      <li class="linea" data-entra>
        <img src="${l.producto.fotos[0]}" alt="">
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
        <button type="button" class="linea-quitar" data-quitar="${l.indice}" aria-label="Quitar ${escapar(l.producto.nombre)}">
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
        </button>
      </li>`,
    )
    .join('')}</ul>
    <button type="button" class="carrito-seguir" data-seguir>+ Seguir sumando productos</button>`;
  el('carrito-pie').hidden = false;
  pintarPie();
}

function pintarPie() {
  const ls = lineas(catalogo);
  const total = ls.reduce((s, l) => s + l.subtotal, 0);
  el('carrito-pie').innerHTML = `
    <fieldset class="entrega">
      <legend class="ficha-sub">¿Cómo lo recibís?</legend>
      <div class="entrega-opciones">
        <button type="button" class="entrega-opcion" data-entrega="envio" aria-pressed="${datos.entrega === 'envio'}">
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
          <b>Envío</b><small>Gratis en Hurlingham. Al resto, te lo cotizamos por WhatsApp</small>
        </button>
        <button type="button" class="entrega-opcion" data-entrega="retiro" aria-pressed="${datos.entrega === 'retiro'}">
          <svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
          <b>Retiro</b><small>Coordinamos el punto de retiro</small>
        </button>
      </div>
    </fieldset>
    <div class="carrito-campos">
      <label><span>Tu nombre <small>(opcional)</small></span><input type="text" data-campo="nombre" value="${escapar(datos.nombre)}" autocomplete="given-name" maxlength="60"></label>
      ${datos.entrega === 'envio' ? `<label><span>Barrio o localidad <small>(opcional)</small></span><input type="text" data-campo="zona" value="${escapar(datos.zona)}" autocomplete="address-level2" maxlength="60"></label>` : ''}
    </div>
    <div class="carrito-total"><span>Total</span><b>${formatoPrecio(total)}</b></div>
    <a class="btn btn-wa" id="carrito-enviar" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.34m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41"/></svg>
      <span id="carrito-enviar-texto"></span>
    </a>
    <button type="button" class="carrito-vaciar" data-vaciar>Vaciar carrito</button>`;
  const enviar = el('carrito-enviar');
  enviar.addEventListener('click', (e) => {
    if (!datos.entrega) {
      e.preventDefault();
      const f = el('carrito').querySelector('.entrega');
      f.classList.remove('sacudir');
      void f.offsetWidth;
      f.classList.add('sacudir');
      f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  actualizarLink();
}

function actualizarLink() {
  const enviar = el('carrito-enviar');
  if (!enviar) return;
  const listo = Boolean(datos.entrega);
  enviar.classList.toggle('falta', !listo);
  el('carrito-enviar-texto').textContent = listo ? 'Enviar pedido por WhatsApp' : 'Elegí envío o retiro';
  enviar.href = listo ? linkPedido(mensajeWhatsApp(lineas(catalogo), datos)) : '#';
}
