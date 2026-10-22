// Carrito: lista de { id, sabor, tamano, cantidad }. Se guarda en el navegador de cada cliente.
// Los precios no se guardan: siempre se toman del catálogo, así un cambio de precio se ve al instante.
import { WHATSAPP } from './config.js';
import { formatoPrecio } from './datos.js';

const CLAVE = 'repzone-carrito';
const oyentes = new Set();
let items = leer();

function leer() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(v) ? v.filter((i) => i && i.id && i.cantidad > 0) : [];
  } catch {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {}
  oyentes.forEach((f) => f(items));
}

const mismo = (a, b) => a.id === b.id && (a.sabor || '') === (b.sabor || '') && (a.tamano || '') === (b.tamano || '');

export const carrito = {
  items: () => items,
  cantidad: () => items.reduce((s, i) => s + i.cantidad, 0),
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
    guardar();
  },
};

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
  const total = ls.reduce((s, l) => s + l.subtotal, 0);
  const renglones = ls.map((l) => {
    const detalle = [l.producto.marca, l.tamano].filter(Boolean).join(' · ');
    const sabor = textoSabor(l.producto, l.sabor);
    return `• ${l.cantidad}x ${l.producto.nombre}${detalle ? ` (${detalle})` : ''}${sabor ? ` — Sabor: ${sabor}` : ''} — ${formatoPrecio(l.subtotal)}`;
  });
  const partes = [
    '¡Hola RepZone! Quiero hacer este pedido:',
    '',
    ...renglones,
    '',
    `*Total: ${formatoPrecio(total)}*`,
    entrega === 'envio' ? 'Entrega: Envío (a cotizar)' : 'Entrega: Retiro (a coordinar)',
  ];
  if (entrega === 'envio') {
    if (zona) partes.push(`Barrio/localidad: ${zona.trim()}`);
    if (domicilio) partes.push(`Domicilio: ${domicilio.trim()}`);
  }
  if (nombre) partes.push(`Nombre: ${nombre}`);
  return partes.join('\n');
}

export const linkPedido = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
