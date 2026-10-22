// Catálogo: se lee de un CSV con una fila por producto (la misma forma que la planilla de Google).
// Mientras no esté conectada la planilla se usa public/catalogo.csv, que además queda como respaldo.

export const PLANILLA_CSV = ''; // Parte 3: URL de la planilla publicada como CSV
const RESPALDO = '/catalogo.csv';

let promesa;

export function cargarCatalogo() {
  promesa ??= leer(PLANILLA_CSV)
    .catch(() => leer(RESPALDO))
    .then((filas) => filas.map(normalizar).filter((p) => p.id && p.nombre && p.stock));
  return promesa;
}

async function leer(url) {
  if (!url) throw new Error('sin planilla');
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return parsearCSV(await r.text());
}

const si = (v) => /^(si|sí|s|x|1|true)$/i.test(String(v).trim());
const lista = (v) => String(v || '').split('|').map((s) => s.trim()).filter(Boolean);
const numero = (v) => {
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return n > 0 ? n : null;
};

function normalizar(f) {
  const stock = String(f.stock ?? '').trim();
  return {
    id: f.id?.trim(),
    nombre: f.nombre?.trim(),
    marca: f.marca?.trim() || '',
    categoria: f.categoria?.trim() || '',
    precio: numero(f.precio),
    precioAnterior: numero(f.precio_anterior),
    // "200 g = 5100 | 400 g = 7500"
    tamanos: lista(f['tamaños']).map((t) => {
      const [nombre, precio] = t.split('=').map((s) => s.trim());
      return { nombre, precio: numero(precio) };
    }),
    // "Chocolate #5A3A22 | Vainilla"
    sabores: lista(f.sabores).map((s) => {
      const m = s.match(/^(.*?)\s*(#[0-9a-f]{3,8})?$/i);
      return { nombre: m[1], color: m[2] || null };
    }),
    fotos: lista(f.fotos).map((n) => (/^https?:/.test(n) ? n : `/productos/${n}`)),
    beneficios: lista(f.beneficios),
    composicion: f.composicion || '',
    tablaNutricional: f.tabla_nutricional || '',
    modoUso: f.modo_uso || '',
    oferta: si(f.oferta),
    tendencia: si(f.tendencia),
    combo: si(f.combo),
    // stock: SI/NO o un número; vacío cuenta como disponible
    stock: stock === '' || si(stock) || numero(stock) > 0,
  };
}

// CSV con comillas, comas y saltos de línea dentro de los campos
export function parsearCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') {
      fila.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else campo += c;
  }
  if (campo || fila.length) filas.push([...fila, campo]);
  const [cabecera, ...resto] = filas.filter((f) => f.some((c) => c.trim()));
  const claves = cabecera.map((c) => c.trim().toLowerCase());
  return resto.map((f) => Object.fromEntries(claves.map((k, i) => [k, f[i] ?? ''])));
}

export const formatoPrecio = (n) => '$' + n.toLocaleString('es-AR');

export const descuento = (p) => (p.precioAnterior > p.precio ? Math.floor((1 - p.precio / p.precioAnterior) * 100) : 0);

// Búsqueda: sin acentos ni mayúsculas; cada palabra tiene que aparecer en el nombre, la marca o la categoría
export const normalizarTexto = (t) =>
  String(t)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim();

export function buscar(catalogo, texto) {
  const palabras = normalizarTexto(texto).split(' ').filter(Boolean);
  if (!palabras.length) return [];
  return catalogo
    .map((p) => {
      p._busqueda ??= normalizarTexto(`${p.nombre} ${p.marca} ${p.categoria} ${p.combo ? 'combo' : ''} ${p.oferta ? 'oferta' : ''}`);
      const nombre = normalizarTexto(p.nombre);
      if (!palabras.every((w) => p._busqueda.includes(w))) return null;
      // primero lo que coincide en el nombre, después por marca
      const puntos = palabras.reduce((s, w) => s + (nombre.startsWith(w) ? 3 : nombre.includes(w) ? 2 : 1), 0);
      return { p, puntos };
    })
    .filter(Boolean)
    .sort((a, b) => b.puntos - a.puntos)
    .map((r) => r.p);
}
