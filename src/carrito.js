// Carrito: lista de { id, sabor, tamano, cantidad }. Se guarda en el navegador de cada cliente.
// Los precios no se guardan: siempre se toman del catálogo, así un cambio de precio se ve al instante.
import { WHATSAPP, RULETA } from './config.js';
import { formatoPrecio } from './datos.js';

const CLAVE = 'repzone-carrito';
const CLAVE_RULETA = 'repzone-ruleta';
const oyentes = new Set();
let items = leer();
// Ruleta: lista de giros del pedido, cada uno { premio } (índice en RULETA.premios; null = todavía sin girar)
let giros = leerGiros();

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
    return Array.isArray(g) ? g.filter((x) => x && (x.premio === null || Number.isInteger(x.premio))) : [];
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
    localStorage.setItem(CLAVE_RULETA, JSON.stringify(giros));
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
    guardar();
  },
};

// Ruleta: cada giro se suma al pedido por RULETA.precio y siempre toca un premio.
// Se puede girar las veces que se quiera; los premios quedan en el pedido.
export const ruleta = {
  cantidad: () => giros.length,
  pendientes: () => giros.filter((g) => g.premio === null).length,
  // índices de los premios que ya salieron, en orden
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
  // Elige el premio según los pesos y lo guarda antes de la animación (cerrar a mitad no cambia nada)
  girar() {
    const giro = giros.find((g) => g.premio === null);
    if (!giro) return null;
    const pesos = RULETA.premios.map((p) => p.peso);
    const total = pesos.reduce((s, w) => s + w, 0);
    const azar = (crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * total;
    let i = 0;
    for (let acumulado = pesos[0]; azar >= acumulado && i < pesos.length - 1; acumulado += pesos[++i]);
    giro.premio = i;
    guardar();
    return i;
  },
};

export const totalPedido = (ls) => ls.reduce((s, l) => s + l.subtotal, 0) + giros.length * RULETA.precio;

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

export function mensajeWhatsApp(ls, { entrega, nombre, zona, domicilio }) {
  const total = totalPedido(ls);
  const renglones = ls.map((l) => {
    const detalle = [l.producto.marca, l.tamano].filter(Boolean).join(' · ');
    const sabor = textoSabor(l.producto, l.sabor);
    return `• ${l.cantidad}x ${l.producto.nombre}${detalle ? ` (${detalle})` : ''}${sabor ? ` — Sabor: ${sabor}` : ''} — ${formatoPrecio(l.subtotal)}`;
  });
  ruleta.premios().forEach((i) => {
    const premio = RULETA.premios[i];
    renglones.push(`• Giro de ruleta — ${formatoPrecio(RULETA.precio)} — Premio: ${premio.nombre} (${premio.marca})`);
  });
  const partes = [
    '¡Hola RepZone! Quiero hacer este pedido:',
    '',
    ...renglones,
    '',
    `*Total: ${formatoPrecio(total)}*`,
    entrega === 'envio' ? 'Entrega: Envío (a cotizar)' : 'Entrega: Retiro en el centro de distribución',
  ];
  if (entrega === 'envio') {
    if (zona) partes.push(`Barrio/localidad: ${zona.trim()}`);
    if (domicilio) partes.push(`Domicilio: ${domicilio.trim()}`);
  }
  if (nombre) partes.push(`Nombre: ${nombre}`);
  return partes.join('\n');
}

export const linkPedido = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
