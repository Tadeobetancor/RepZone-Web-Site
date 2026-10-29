// Envíos: cada localidad con su zona y su costo. Se leen de la pestaña "Envíos" de la planilla;
// mientras no responde, o si falla, se usa la última copia que guardó este navegador o public/envios.csv.
// En la columna Envío se elige Gratis, Con precio (y el precio va al lado) o A cotizar.
import { filasCSV, formatoPrecio, normalizarTexto, numero } from './datos.js';

// Link de la pestaña Envíos publicada como CSV (Archivo › Compartir › Publicar en la Web › Envíos › .csv).
// Vacío = se usa public/envios.csv.
export const ENVIOS_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxTNI6E53meRBrGwxcxKyEOUsoZ36bvad9jcCXksYWCSpi7U10F4YZuR8ZsAm6VJBIe64I9Dg-RRnt/pub?gid=1604369499&single=true&output=csv';
const RESPALDO = '/envios.csv';
const ESPERA_MAXIMA = 4000;
const CLAVE_COPIA = 'repzone-envios-planilla';

// { nombre, zona, costo }: costo es el precio, 0 si es gratis o null si es a cotizar
export const localidades = [];

const clave = (t) => normalizarTexto(t);

// Envío: Gratis, A cotizar o Con precio (el precio va en su columna). También acepta el precio escrito en Envío.
function costo(envio, precio = '') {
  const t = clave(envio);
  if (t.includes('gratis') || /^0+$/.test(t)) return 0;
  if (t.includes('cotiz')) return null;
  return numero(precio) ?? numero(envio);
}

export const textoCosto = (c) => (c === null ? 'A cotizar' : c === 0 ? 'Gratis' : formatoPrecio(c));

// Fila de sección de la planilla ("🏠  HURLINGHAM"): todo en mayúsculas y sin envío
const esZona = (nombre, envio) => !envio.trim() && /[A-ZÁÉÍÓÚÑ]/.test(nombre) && !/[a-záéíóúñ]/.test(nombre);
const sinEmoji = (t) => t.replace(/^[^\p{L}\d]+/u, '').trim();

// Pestaña Envíos: arriba el título y la ayuda; después los títulos de columna (📍 Localidad, 🚚 Envío, 💲 Precio)
// y una localidad por fila, agrupadas bajo filas de zona. También acepta una columna Zona en lugar de las filas.
function leerPestana(texto) {
  const filas = filasCSV(texto);
  const iCab = filas.findIndex((f) => f.map(clave).includes('localidad'));
  if (iCab < 0) throw new Error('la pestaña Envíos no tiene la columna Localidad');
  const cab = filas[iCab].map(clave);
  const cL = cab.indexOf('localidad');
  const cZ = cab.findIndex((k) => k.includes('zona'));
  const cE = cab.findIndex((k) => k.includes('envio'));
  const cP = cab.findIndex((k) => /precio|costo/.test(k));
  const lista = [];
  let zona = '';
  for (const f of filas.slice(iCab + 1)) {
    const nombre = (f[cL] ?? '').trim();
    const envio = f[cE] ?? '';
    const precio = f[cP] ?? '';
    if (!nombre) continue;
    if (cZ < 0 && esZona(nombre, envio + precio)) {
      zona = sinEmoji(nombre);
      continue;
    }
    lista.push({ nombre, zona: cZ < 0 ? zona : (f[cZ] ?? '').trim(), costo: costo(envio, precio) });
  }
  if (!lista.length) throw new Error('la pestaña Envíos no tiene localidades');
  return lista;
}

// La localidad elegida con su costo; una que no está en la lista va a cotizar
export function envioDe(nombre) {
  const n = clave(nombre);
  return localidades.find((l) => clave(l.nombre) === n) ?? { nombre, zona: '', costo: null };
}

// Para el buscador: sin texto, todas en el orden de la planilla; con texto, primero las que empiezan así
export function buscarLocalidades(texto) {
  const q = clave(texto);
  if (!q) return localidades;
  return localidades
    .filter((l) => clave(l.nombre).includes(q))
    .sort((a, b) => {
      const [an, bn] = [clave(a.nombre), clave(b.nombre)];
      const [aEmpieza, bEmpieza] = [an.startsWith(q), bn.startsWith(q)];
      return aEmpieza !== bEmpieza ? (aEmpieza ? -1 : 1) : an.localeCompare(bn);
    });
}

let promesa;

export function cargarEnvios() {
  promesa ??= leerPlanilla()
    .catch(() => {
      const copia = copiaGuardada();
      if (copia) return leerPestana(copia);
      throw new Error('sin copia');
    })
    .catch(async () => leerPestana(await (await fetch(RESPALDO)).text()))
    .then((lista) => localidades.splice(0, localidades.length, ...lista))
    .catch(() => localidades);
  return promesa;
}

async function leerPlanilla() {
  if (!ENVIOS_CSV) throw new Error('sin planilla');
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAXIMA);
  try {
    const r = await fetch(ENVIOS_CSV, { cache: 'no-cache', signal: corte.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const texto = await r.text();
    const lista = leerPestana(texto);
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
