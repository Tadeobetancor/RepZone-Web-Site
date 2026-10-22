// Miniaturas de las fotos de productos para la grilla y el carrusel (400 px de ancho).
// Corre solo antes de "npm run dev" y "npm run build": las fotos nuevas que se suman a
// public/productos/ tienen su miniatura sin hacer nada más.
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ORIGEN = 'public/productos';
const DESTINO = 'public/productos/400';
const ANCHO = 400;

await mkdir(DESTINO, { recursive: true });
const fotos = (await readdir(ORIGEN)).filter((f) => /\.(webp|png|jpe?g)$/i.test(f));
let hechas = 0;

for (const foto of fotos) {
  const salida = join(DESTINO, foto.replace(/\.\w+$/, '.webp'));
  // se rehace solo si la foto original es más nueva que su miniatura
  const original = await stat(join(ORIGEN, foto));
  const previa = await stat(salida).catch(() => null);
  if (previa && previa.mtimeMs >= original.mtimeMs) continue;
  await sharp(join(ORIGEN, foto))
    .resize({ width: ANCHO, height: ANCHO, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(salida);
  hechas++;
}

console.log(`Miniaturas: ${hechas} nuevas, ${fotos.length} en total`);
