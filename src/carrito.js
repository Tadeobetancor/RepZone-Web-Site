// Carrito: lista de { id, sabor, tamano, cantidad }. Se guarda en el navegador de cada cliente.
// Los precios no se guardan: siempre se toman del catálogo, así un cambio de precio se ve al instante.
import { CUPONES, WHATSAPP } from './config.js';
import { formatoPrecio } from './datos.js';
import { ruletaActual } from './ruleta-datos.js';
import { envioDe, textoCosto } from './envios-datos.js';

const CLAVE = 'repzone-carrito';
const CLAVE_RULETA = 'repzone-ruleta';
const CLAVE_CUPON = 'repzone-cupon';
const oyentes = new Set();
let items = leer();
// Ruleta: lista de giros del pedido, cada uno { premio }: null = todavía sin girar, o el premio que tocó
// guardado entero ({ nombre, marca, codigo, foto }), así un cambio en la planilla no cambia lo que ya se ganó
let giros = leerGiros();
// Código de descuento aplicado (el código tal cual está en config.js) o ''
let codigoCupon = leerCupon();

function leer() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(v) ? v.filter((i) => i && i.id && i.cantidad > 0) : [];
  } catch {
    return [];
  }
}

function leerGiros() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_RULETA) || '[]');
    return Array.isArray(g) ? g.filter((x) => x && (x.premio === null || (typeof x.premio === 'object' && x.premio.nombre))) : [];
  } catch {
    return [];
  }
}

function leerCupon() {
  try {
    return buscarCupon(localStorage.getItem(CLAVE_CUPON) || '')?.codigo ?? '';
  } catch {
    return '';
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
    localStorage.setItem(CLAVE_RULETA, JSON.stringify(giros));
    localStorage.setItem(CLAVE_CUPON, codigoCupon);
  } catch {}
  oyentes.forEach((f) => f(items));
}

const mismo = (a, b) => a.id === b.id && (a.sabor || '') === (b.sabor || '') && (a.tamano || '') === (b.tamano || '');

export const carrito = {
  items: () => items,
  // cada giro de la ruleta cuenta como un ítem más del pedido
  cantidad: () => items.reduce((s, i) => s + i.cantidad, 0) + giros.length,
  escuchar(f) {
    oyentes.add(f);
    return () => oyentes.delete(f);
  },
  agregar(item) {
    const existente = items.find((i) => mismo(i, item));
    if (existente) existente.cantidad = Math.min(99, existente.cantidad + item.cantidad);
    else items.push({ ...item });
    guardar();
  },
  cambiar(indice, cantidad) {
    if (!items[indice]) return;
    if (cantidad <= 0) items.splice(indice, 1);
    else items[indice].cantidad = Math.min(99, cantidad);
    guardar();
  },
  quitar(indice) {
    items.splice(indice, 1);
    guardar();
  },
  vaciar() {
    items = [];
    giros = [];
    codigoCupon = '';
    guardar();
  },
};

// Ruleta: cada giro se suma al pedido por el precio de la planilla y siempre toca un premio.
// Se puede girar las veces que se quiera; los premios quedan en el pedido.
export const ruleta = {
  cantidad: () => giros.length,
  pendientes: () => giros.filter((g) => g.premio === null).length,
  // premios que ya salieron, en orden: { nombre, marca, codigo, foto }
  premios: () => giros.filter((g) => g.premio !== null).map((g) => g.premio),
  comprar() {
    giros.push({ premio: null });
    guardar();
  },
  // saca un giro todavía sin girar (los que ya tienen premio quedan en el pedido)
  quitarPendiente() {
    const i = giros.findIndex((g) => g.premio === null);
    if (i >= 0) giros.splice(i, 1);
    guardar();
  },
  // Elige el premio según los pesos y lo guarda antes de la animación (cerrar a mitad no cambia nada).
  // Devuelve su lugar en la rueda.
  girar() {
    const giro = giros.find((g) => g.premio === null);
    if (!giro) return null;
    const pesos = ruletaActual.premios.map((p) => p.peso);
    const total = pesos.reduce((s, w) => s + w, 0);
    const azar = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * total;
    let i = 0;
    for (let acumulado = pesos[0]; azar >= acumulado && i < pesos.length - 1; acumulado += pesos[++i]);
    const { nombre, marca, codigo, foto } = ruletaActual.premios[i];
    giro.premio = { nombre, marca, codigo, foto };
    guardar();
    return i;
  },
};

// Códigos de descuento: el código se compara sin mayúsculas ni espacios
function buscarCupon(texto) {
  const t = String(texto).replace(/\s+/g, '').toLowerCase();
  return t ? CUPONES.find((c) => c.codigo.toLowerCase() === t) : undefined;
}

export const cupon = {
  // el aplicado: { codigo, porcentaje, atleta } o null
  actual: () => buscarCupon(codigoCupon) ?? null,
  // devuelve el cupón si el código vale; si no, null y queda el que estaba
  aplicar(texto) {
    const c = buscarCupon(texto);
    if (!c) return null;
    codigoCupon = c.codigo;
    guardar();
    return c;
  },
  quitar() {
    codigoCupon = '';
    guardar();
  },
};

// Lo que descuenta el código: su % sobre todos los productos, combos incluidos (la ruleta y el envío no cuentan)
export function descuentoPedido(ls) {
  const c = cupon.actual();
  if (!c) return 0;
  const base = ls.reduce((s, l) => s + l.subtotal, 0);
  return Math.round((base * c.porcentaje) / 100);
}

export const totalPedido = (ls) => ls.reduce((s, l) => s + l.subtotal, 0) + giros.length * ruletaActual.precio - descuentoPedido(ls);

// Precio de una línea: el del tamaño elegido o el del producto
export function precioDe(producto, tamano) {
  return producto.tamanos.find((t) => t.nombre === tamano)?.precio ?? producto.precio;
}

// Junta cada línea con su producto del catálogo; descarta lo que ya no existe o quedó sin stock
export function lineas(catalogo) {
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  return items
    .map((item, indice) => {
      const producto = porId.get(item.id);
      if (!producto) return null;
      const precio = precioDe(producto, item.tamano);
      return { ...item, indice, producto, precio, subtotal: precio * item.cantidad };
    })
    .filter(Boolean);
}

// Qué sabor mostrar: el elegido; si el producto no tiene opciones, se aclara igual
export function textoSabor(producto, sabor) {
  if (sabor) return sabor;
  if (producto.combo) return 'a elegir por WhatsApp';
  if (producto.categoria === 'shakers') return '';
  return 'único';
}

// El envío elegido con su costo (null si es retiro o todavía no eligió la localidad)
export const envioPedido = ({ entrega, zona }) => (entrega === 'envio' && zona ? envioDe(zona) : null);

export function mensajeWhatsApp(ls, { entrega, nombre, zona, domicilio }) {
  const envio = envioPedido({ entrega, zona });
  const total = totalPedido(ls) + (envio?.costo ?? 0);
  const renglones = ls.map((l) => {
    const detalle = [l.producto.marca, l.tamano].filter(Boolean).join(' · ');
    const sabor = textoSabor(l.producto, l.sabor);
    return `• ${l.cantidad}x ${l.producto.nombre}${detalle ? ` (${detalle})` : ''}${sabor ? ` — Sabor: ${sabor}` : ''} — ${formatoPrecio(l.subtotal)}`;
  });
  ruleta.premios().forEach((p) => {
    renglones.push(`• Giro de ruleta — ${formatoPrecio(ruletaActual.precio)} — Premio: ${p.nombre} (${p.marca})${p.codigo ? ` — Código: ${p.codigo}` : ''}`);
  });
  const c = cupon.actual();
  const descuento = descuentoPedido(ls);
  if (c && descuento) renglones.push(`• Código de descuento ${c.codigo} (${c.porcentaje}% off)`);
  if (envio) renglones.push(`• Envío a ${envio.nombre} — ${envio.costo === null ? 'a cotizar' : textoCosto(envio.costo)}`);
  const partes = [
    '¡Hola RepZone! Quiero hacer este pedido:',
    '',
    ...renglones,
    '',
    `*Total: ${formatoPrecio(total)}*${envio?.costo === null ? ' + envío a cotizar' : ''}`,
    entrega === 'envio' ? 'Entrega: Envío a domicilio' : 'Entrega: Retiro en el centro de distribución',
  ];
  if (entrega === 'envio') {
    if (zona) partes.push(`Localidad: ${zona.trim()}`);
    if (domicilio) partes.push(`Domicilio: ${domicilio.trim()}`);
  }
  if (nombre) partes.push(`Nombre: ${nombre}`);
  return partes.join('\n');
}

export const linkPedido = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
