// Íconos de beneficios (la palabra clave de la planilla → dibujo) y colores de sabores

const TRAZOS = {
  musculo: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  fuerza: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  energia: 'M13 2 4 14h7l-1 8 9-12h-7z',
  recuperacion: 'M20 12a8 8 0 1 1-2.35-5.65M20 4v5h-5',
  rapido: 'M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 9v4l2.5 2.5M9 2h6',
  foco: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  fuego: 'M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z',
  salud: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v6M9 11h6',
  corazon: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  descanso: 'M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z',
  articulaciones: 'M17 3a3 3 0 0 0-2.8 4.1L7.1 14.2A3 3 0 1 0 9.8 17l7.1-7.1A3 3 0 1 0 17 3z',
  hidratacion: 'M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z',
  calma: 'M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2',
  hoja: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6',
  liviano: 'M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5zM16 8 2 22M17.5 15H9',
  calidad: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 22l5-3 5 3-1.2-8.1',
  sabor: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  ahorro: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
  pack: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  bombeo: 'M3 12h4l3-8 4 16 3-8h4',
  mezcla: 'M6 3h12l-1.5 18h-9zM5 8h14',
  practico: 'M6 7h12l1 14H5zM9 7V5a3 3 0 0 1 6 0v2',
  limpieza: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z',
};

export function icono(clave) {
  const d = TRAZOS[clave] || TRAZOS.calidad;
  return `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}

// Beneficio "musculo: Ayuda a ganar músculo" → { icono, texto }
export function beneficio(linea) {
  const m = linea.match(/^\s*([a-záéíóú]+)\s*:\s*(.+)$/i);
  return m ? { clave: m[1].toLowerCase(), texto: m[2] } : { clave: 'calidad', texto: linea };
}

// Color del botón de sabor: el de la planilla (#hex) o uno que se deduce del nombre
const SABORES = [
  [/cookies|cream/, '#8b7a6b'],
  [/dulce de leche|caramel/, '#c0803f'],
  [/chocolate|choco|cacao/, '#5a3a22'],
  [/vainill/, '#efe0b0'],
  [/frutilla|strawberr/, '#e8567a'],
  [/frutos rojos|frutos del bosque|berr/, '#b0243c'],
  [/banana/, '#f2d14b'],
  [/manzana verde|green|lima/, '#86c440'],
  [/manzana|apple/, '#d63b3b'],
  [/lim[oó]n|lemon|limonada|citrus/, '#ecd94a'],
  [/naranja|orange/, '#f08a24'],
  [/uva|grape|acai/, '#6b3fa0'],
  [/sand[ií]a|watermelon/, '#ea4c5e'],
  [/fruit punch|punch/, '#e0315a'],
  [/blue|raz/, '#2f7fe0'],
  [/mango|peach|durazno|tropical/, '#f5a623'],
  [/pomelo/, '#f07a6a'],
  [/anan[aá]|pi[nñ]a/, '#f4c430'],
  [/coco|natural|crocante/, '#d8c3a0'],
  [/avellana/, '#8a5a34'],
  [/sin sabor|neutro/, '#d9d9de'],
  [/jam[oó]n|queso/, '#e9b98c'],
  [/verdura/, '#6aa84f'],
  [/cotton|candy|miami|party/, '#e86ac0'],
  [/multifrut|tutti|potion/, '#c2410c'],
];

export function colorSabor(sabor) {
  if (sabor.color) return sabor.color;
  const n = sabor.nombre.toLowerCase();
  return SABORES.find(([re]) => re.test(n))?.[1] || null;
}

// Texto legible sobre ese color
export function tintaSobre(hex) {
  const v = hex.replace('#', '');
  const [r, g, b] = (v.length === 3 ? v.split('').map((c) => c + c) : v.match(/../g)).map((x) => parseInt(x, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#141416' : '#ffffff';
}
