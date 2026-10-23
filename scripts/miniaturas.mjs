// Versiones de las fotos de productos, a partir de public/productos/:
//   400/  → miniaturas para la grilla, el carrusel y las listas (400 px)
//   1600/ → foto ampliada (zoom de la ficha): agrandada con buen filtro y un toque de nitidez,
//           así no se ve pixelada al abrirla en grande
// Corre solo antes de "npm run dev" y "npm run build": las fotos nuevas que se suman a
// public/productos/ tienen sus versiones sin hacer nada más.
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ORIGEN = 'public/productos';
const VERSIONES = [
  { carpeta: '400', lado: 400, calidad: 78 },
  { carpeta: '1600', lado: 1600, calidad: 82, agrandar: true },
];

const fotos = (await readdir(ORIGEN)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f));
const hechas = Object.fromEntries(VERSIONES.map((v) => [v.carpeta, 0]));

for (const v of VERSIONES) await mkdir(join(ORIGEN, v.carpeta), { recursive: true });

for (const foto of fotos) {
  const original = await stat(join(ORIGEN, foto));
  for (const v of VERSIONES) {
    const salida = join(ORIGEN, v.carpeta, foto.replace(/\.\w+$/, '.webp'));
    // se rehace solo si la foto original es más nueva que su versión
    const previa = await stat(salida).catch(() => null);
    if (previa && previa.mtimeMs >= original.mtimeMs) continue;
    let imagen = sharp(join(ORIGEN, foto)).resize({
      width: v.lado,
      height: v.lado,
      fit: 'inside',
      withoutEnlargement: !v.agrandar,
      kernel: 'lanczos3',
    });
    if (v.agrandar) imagen = imagen.sharpen({ sigma: 1.1, m1: 0.6, m2: 2.2 });
    await imagen.webp({ quality: v.calidad, alphaQuality: 100 }).toFile(salida);
    hechas[v.carpeta]++;
  }
}

console.log(`Fotos: ${fotos.length} · nuevas → ${VERSIONES.map((v) => `${v.carpeta}: ${hechas[v.carpeta]}`).join(', ')}`);
