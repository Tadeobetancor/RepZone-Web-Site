// Catálogo: se lee de un CSV con una fila por producto (la planilla de Google publicada como CSV).
// La planilla puede tener un título arriba, nombres de columna amigables ("Precio anterior", "¿Hay stock?")
// y filas de sección (un nombre sin precio): todo eso se reconoce acá.
// Orden: la planilla → la última copia que este navegador bajó de la planilla → public/catalogo.csv.
// La planilla se pide apenas abre la página, así que la espera queda tapada por la pantalla de carga.

// Link de la planilla publicada como CSV (Archivo › Compartir › Publicar en la Web › pestaña Productos › .csv).
// Planilla simple del cliente (desde el 23/10/2026).
// Vacío = se usa public/catalogo.csv.
export const PLANILLA_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxTNI6E53meRBrGwxcxKyEOUsoZ36bvad9jcCXksYWCSpi7U10F4YZuR8ZsAm6VJBIe64I9Dg-RRnt/pub?gid=1931374867&single=true&output=csv';
const RESPALDO = '/catalogo.csv';
const ESPERA_MAXIMA = 4000; // si Google tarda más, se muestra la última copia y no se hace esperar al cliente
const CLAVE_COPIA = 'repzone-catalogo';

import { CATEGORIAS } from './config.js';

let promesa;

export function cargarCatalogo() {
  promesa ??= leerPlanilla().catch(async () => {
    const copia = copiaGuardada();
    return (copia && productos(copia)) || productos(await leer(RESPALDO));
  });
  return promesa;
}

// Un producto necesita nombre y precio: así las filas de sección de la planilla quedan afuera
const productos = (texto) =>
  parsearCSV(texto)
    .map(normalizar)
    .filter((p) => p.nombre && p.precio && p.stock);

async function leerPlanilla() {
  if (!PLANILLA_CSV) throw new Error('sin planilla');
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAXIMA);
  try {
    const texto = await leer(PLANILLA_CSV, corte.signal);
    // una planilla vacía o una página de error de Google no reemplazan al catálogo
    const lista = productos(texto);
    if (!lista.length) throw new Error('la planilla no tiene productos');
    try {
      localStorage.setItem(CLAVE_COPIA, texto);
    } catch {}
    return lista;
  } finally {
    clearTimeout(reloj);
  }
}

function copiaGuardada() {
  try {
    return localStorage.getItem(CLAVE_COPIA) || null;
  } catch {
    return null;
  }
}

async function leer(url, signal) {
  const r = await fetch(url, { cache: 'no-cache', signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const si = (v) => /^(si|sí|s|x|1|true)$/i.test(String(v).trim());
const lista = (v, separador = '|') => String(v || '').split(separador).map((s) => s.trim()).filter(Boolean);
const numero = (v) => {
  const n = Number(String(v).replace(/[^\d]/g, ''));
  return n > 0 ? n : null;
};

// Foto de la planilla: nombre de archivo en public/productos/, link de Google Drive o link a una imagen.
// Un link de Drive ("Compartir › Copiar vínculo", con acceso para cualquiera con el link) se convierte
// en la imagen misma; drive(id, ancho) pide el tamaño justo para cada lugar.
const drive = (id, ancho) => `https://drive.google.com/thumbnail?id=${id}&sz=w${ancho}`;
const idDrive = (url) => url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([\w-]{20,})/)?.[1];

function rutaFoto(n) {
  if (!/^https?:/i.test(n)) return `/productos/${n}`;
  const id = idDrive(n);
  return id ? drive(id, 800) : n;
}

// La categoría se puede escribir como la ve el cliente ("Proteínas") o con su código ("proteinas")
// Los aminoácidos van en Variados, y todo lo que se llama "Omega…" (salvo los combos) en Omega 3,
// aunque la planilla diga otra cosa.
const MUDADAS = { aminoacidos: 'variados' };

function categoria(v, { nombre = '', combo = false } = {}) {
  if (/omega/i.test(nombre) && !combo) return 'omega3';
  const t = normalizarTexto(v || '');
  const c = CATEGORIAS.find((c) => normalizarTexto(c.id) === t || normalizarTexto(c.nombre) === t);
  const id = c ? c.id : t.replace(/ /g, '-');
  return MUDADAS[id] ?? id;
}

function normalizar(f) {
  const stock = String(f.stock ?? '').trim();
  const nombre = f.nombre?.trim();
  const marca = f.marca?.trim() || '';
  const precio = numero(f.precio);
  const precioAnterior = numero(f.precio_anterior);
  // en la planilla simple no hay columna "¿Es combo?": la categoría Combos alcanza
  const combo = si(f.combo) || /^combos?$/.test(normalizarTexto(f.categoria || ''));
  return {
    // sin código, se arma uno con la marca y el nombre (sirve para el carrito y el link del producto)
    id: f.id?.trim() || normalizarTexto(`${marca} ${nombre || ''}`).replace(/ /g, '-'),
    nombre,
    marca,
    categoria: categoria(f.categoria, { nombre, combo }),
    precio,
    precioAnterior,
    // "200 g = 5100 | 400 g = 7500"
    tamanos: lista(f.tamanos).map((t) => {
      const [nombre, precio] = t.split('=').map((s) => s.trim());
      return { nombre, precio: numero(precio) };
    }),
    // "Chocolate #5A3A22, Vainilla" (con comas o con |)
    sabores: lista(f.sabores, /[|,]/).map((s) => {
      const m = s.match(/^(.*?)\s*(#[0-9a-f]{3,8})?$/i);
      return { nombre: m[1], color: m[2] || null };
    }),
    // "📸 Foto" (link de Drive que pega el cliente) manda; si está vacía, la foto de siempre
    fotos: lista(f.foto_link || f.fotos).map(rutaFoto),
    beneficios: lista(f.beneficios),
    composicion: f.composicion || '',
    tablaNutricional: f.tabla_nutricional || '',
    modoUso: f.modo_uso || '',
    // en oferta: si tiene precio de antes (más alto), o si la planilla vieja lo marcaba
    oferta: si(f.oferta) || precioAnterior > precio,
    tendencia: si(f.tendencia),
    combo,
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
  const llenas = filas.filter((f) => f.some((c) => c.trim()));
  // la fila de nombres de columna es la primera que tiene la del producto y la del precio
  // (arriba puede haber un título o ayudas)
  const i = llenas.findIndex((f) => f.map(columna).includes('nombre') && f.map(columna).includes('precio'));
  if (i < 0) return [];
  const claves = llenas[i].map(columna);
  return llenas.slice(i + 1).map((f) => Object.fromEntries(claves.map((k, j) => [k, f[j] ?? ''])));
}

// Nombres de columna: los de la planilla para el cliente y los originales (catalogo.csv)
const COLUMNAS = {
  codigo: 'id',
  producto: 'nombre',
  precio_anterior_tachado: 'precio_anterior',
  precio_de_antes: 'precio_anterior',
  foto: 'foto_link',
  foto_nueva: 'foto_link',
  hay_stock: 'stock',
  en_oferta: 'oferta',
  destacado: 'tendencia',
  es_combo: 'combo',
  modo_de_uso: 'modo_uso',
  notas: 'nota',
  notas_internas: 'nota',
};
const columna = (t) => {
  const k = normalizarTexto(String(t).replace(/\(.*?\)/g, '')).replace(/ /g, '_');
  return COLUMNAS[k] || k;
};

// Foto chica (400 px) para tarjetas y listas: pesa menos y el celular la dibuja más rápido.
// Las genera scripts/miniaturas.mjs; las fotos con link externo se usan tal cual.
export const miniatura = (src) =>
  src.startsWith('/productos/')
    ? src.replace('/productos/', '/productos/400/').replace(/\.\w+$/, '.webp')
    : idDrive(src)
      ? drive(idDrive(src), 400)
      : src;

// Foto grande (1600 px, más nítida) para la foto ampliada de la ficha
export const fotoGrande = (src) =>
  src.startsWith('/productos/')
    ? src.replace('/productos/', '/productos/1600/').replace(/\.\w+$/, '.webp')
    : idDrive(src)
      ? drive(idDrive(src), 1600)
      : src;

// Foto chica o grande según el lugar que ocupa en la pantalla
export const fotoAdaptable = (src, sizes) =>
  src.startsWith('/productos/') || idDrive(src)
    ? `src="${miniatura(src)}" srcset="${miniatura(src)} 400w, ${src} 800w" sizes="${sizes}"`
    : `src="${src}"`;

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
