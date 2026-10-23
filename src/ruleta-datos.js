// Ruleta: si está activa, el precio del giro, el % de cada color y los premios (nombre, marca, color,
// código y foto). Se leen de la pestaña "Ruleta" de la planilla; mientras no responde, o si falla,
// se usa la última copia que guardó este navegador o lo de config.js.
import { RULETA } from './config.js';
import { filasCSV, normalizarTexto, numero, rutaFoto, si } from './datos.js';

// Link de la pestaña Ruleta publicada como CSV (Archivo › Compartir › Publicar en la Web › Ruleta › .csv).
// Vacío = se usa lo de config.js.
export const RULETA_CSV =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxTNI6E53meRBrGwxcxKyEOUsoZ36bvad9jcCXksYWCSpi7U10F4YZuR8ZsAm6VJBIe64I9Dg-RRnt/pub?gid=1534111374&single=true&output=csv';
const ESPERA_MAXIMA = 4000;
const CLAVE_COPIA = 'repzone-ruleta-planilla';
const COLORES = ['verde', 'amarillo', 'rojo'];

// Cada premio: la chance de su color repartida en partes iguales entre los premios de ese color
function armar({ activa, precio, porcentajes, premios }) {
  const cuenta = Object.fromEntries(COLORES.map((c) => [c, premios.filter((p) => p.color === c).length]));
  return {
    activa,
    precio,
    porcentajes,
    premios: premios.map((p) => ({
      ...p,
      foto: p.foto ? rutaFoto(p.foto) : '',
      peso: (porcentajes[p.color] ?? 0) / (cuenta[p.color] || 1),
      // sin foto, en la rueda se ve el nombre
      rueda: [p.nombre.toUpperCase(), p.marca.toUpperCase()],
    })),
  };
}

// Lo que usan el carrito y la rueda: arranca con config.js y cargarRuleta() lo actualiza
export const ruletaActual = armar(RULETA);

const clave = (t) => normalizarTexto(t).replace(/ /g, '_');
const color = (t) => COLORES.find((c) => clave(t).includes(c)) ?? 'verde';

// Pestaña Ruleta: arriba la configuración (una fila por dato: nombre y valor), abajo la tabla de premios
function leerPestana(texto) {
  const filas = filasCSV(texto);
  const config = { activa: RULETA.activa, precio: RULETA.precio, porcentajes: { ...RULETA.porcentajes } };
  const iCab = filas.findIndex((f) => f.map(clave).some((k) => k.includes('premio')) && f.map(clave).some((k) => k.includes('color')));
  if (iCab < 0) throw new Error('la pestaña Ruleta no tiene la tabla de premios');
  filas.slice(0, iCab).forEach(([nombre = '', valor = '']) => {
    const k = clave(nombre);
    if (k.includes('activa')) config.activa = si(valor);
    else if (k.includes('precio')) config.precio = numero(valor) ?? config.precio;
    else {
      const c = COLORES.find((x) => k.endsWith(x));
      const pct = Number(String(valor).replace('%', '').replace(',', '.').trim());
      if (c && pct >= 0) config.porcentajes[c] = pct;
    }
  });
  const cab = filas[iCab].map(clave);
  const col = (nombre) => cab.findIndex((k) => k.includes(nombre));
  const [cP, cM, cC, cCod, cF] = ['premio', 'marca', 'color', 'codigo', 'foto'].map(col);
  const premios = filas
    .slice(iCab + 1)
    .map((f) => ({
      nombre: (f[cP] ?? '').trim(),
      marca: (f[cM] ?? '').trim(),
      color: color(f[cC] ?? ''),
      codigo: (f[cCod] ?? '').trim(),
      foto: (f[cF] ?? '').trim(),
    }))
    .filter((p) => p.nombre);
  if (!premios.length) throw new Error('la pestaña Ruleta no tiene premios');
  return { ...config, premios };
}

let promesa;

export function cargarRuleta() {
  promesa ??= leerPlanilla()
    .catch(() => {
      const copia = copiaGuardada();
      if (copia) return leerPestana(copia);
      throw new Error('sin copia');
    })
    .then((datos) => Object.assign(ruletaActual, armar(datos)))
    .catch(() => ruletaActual);
  return promesa;
}

async function leerPlanilla() {
  if (!RULETA_CSV) throw new Error('sin planilla');
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), ESPERA_MAXIMA);
  try {
    const r = await fetch(RULETA_CSV, { cache: 'no-cache', signal: corte.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const texto = await r.text();
    const datos = leerPestana(texto);
    try {
      localStorage.setItem(CLAVE_COPIA, texto);
    } catch {}
    return datos;
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
