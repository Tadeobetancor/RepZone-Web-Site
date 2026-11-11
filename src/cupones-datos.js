// Códigos de descuento: cada uno con su % y el atleta dueño. Se leen de la pestaña "Cupones" de la planilla;
// mientras no responde, o si falla, se usa la última copia que guardó este navegador o CUPONES de config.js.
// También lo usa api/aviso-cupon.js para saber de qué atleta es el código (por eso no toca la página).
import { CUPONES } from './config.js';
import { filasCSV, normalizarTexto } from './datos.js';

// Link de la pestaña Cupones publicada como CSV (Archivo › Compartir › Publicar en la Web › Cupones › .csv).
// Vacío = se usa CUPONES de config.js.
export const CUPONES_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxTNI6E53meRBrGwxcxKyEOUsoZ36bvad9jcCXksYWCSpi7U10F4YZuR8ZsAm6VJBIe64I9Dg-RRnt/pub?gid=694518244&single=true&output=csv';
const ESPERA_MAXIMA = 4000;
const CLAVE_COPIA = 'repzone-cupones-planilla';

// Lo que usa el carrito: arranca con config.js y cargarCupones() lo reemplaza por la planilla
export const cupones = [...CUPONES];

const clave = (t) => normalizarTexto(t);

// "10", "10%", "7,5" o 0,1 (una celda con formato de porcentaje) → 10, 10, 7.5, 10
function porcentaje(v) {
  const t = String(v).trim();
  const n = Number(t.replace('%', '').replace(',', '.').trim());
  if (!(n > 0)) return null;
  const p = n < 1 && !t.includes('%') ? n * 100 : n;
  return p <= 100 ? Math.round(p * 100) / 100 : null;
}

// Pestaña Cupones: arriba el título y la ayuda; después los títulos de columna (Código, % Descuento, Atleta, ¿Activo?)
// y un código por fila. Un código con ¿Activo? en NO no vale; vacío cuenta como SÍ.
export function leerPestana(texto) {
  const filas = filasCSV(texto);
  const iCab = filas.findIndex((f) => f.map(clave).includes('codigo'));
  if (iCab < 0) throw new Error('la pestaña Cupones no tiene la columna Código');
  const cab = filas[iCab].map(clave);
  const col = (...nombres) => cab.findIndex((k) => nombres.some((n) => k.includes(n)));
  const cC = cab.indexOf('codigo');
  const cP = col('descuento', 'porcentaje', '%');
  const cA = col('atleta');
  const cAct = col('activo');
  if (cP < 0) throw new Error('la pestaña Cupones no tiene la columna % Descuento');
  return filas
    .slice(iCab + 1)
    .map((f) => ({
      codigo: (f[cC] ?? '').replace(/\s+/g, ''),
      porcentaje: porcentaje(f[cP] ?? ''),
      atleta: (f[cA] ?? '').trim(),
      activo: cAct < 0 || !/^no$/.test(clave(f[cAct] ?? '')),
    }))
    .filter((c) => c.codigo && c.porcentaje && c.activo)
    .map(({ codigo, porcentaje, atleta }) => ({ codigo, porcentaje, atleta }));
}

// Los códigos de la planilla, o null si no se pudo leer (sin link, Google no responde o la pestaña cambió)
export async function leerPlanilla() {
  if (!CUPONES_CSV) return null;
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAXIMA);
  try {
    const r = await fetch(CUPONES_CSV, { cache: 'no-cache', signal: corte.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const texto = await r.text();
    const lista = leerPestana(texto);
    try {
      localStorage.setItem(CLAVE_COPIA, texto);
    } catch {}
    return lista;
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

let promesa;

export function cargarCupones() {
  promesa ??= leerPlanilla()
    .then((lista) => lista ?? leerPestana(copiaGuardada() ?? ''))
    .then((lista) => cupones.splice(0, cupones.length, ...lista))
    .catch(() => cupones)
    .then(() => cupones);
  return promesa;
}

function copiaGuardada() {
  try {
    return localStorage.getItem(CLAVE_COPIA) || null;
  } catch {
    return null;
  }
}
