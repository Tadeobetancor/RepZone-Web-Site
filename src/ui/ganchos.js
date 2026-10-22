import { cargarCatalogo, formatoPrecio, miniatura } from '../datos.js';

// Botones gancho: etiquetas con datos reales y fotos de productos flotando
export async function iniciarGanchos() {
  const catalogo = await cargarCatalogo();

  // Etiquetas con números reales del catálogo: se actualizan solas cuando cambian los precios
  const precios = catalogo.filter((p) => p.combo && p.precio).map((p) => p.precio);
  const descuentos = catalogo
    .filter((p) => p.oferta && p.precio && p.precioAnterior > p.precio)
    .map((p) => Math.floor((1 - p.precio / p.precioAnterior) * 100));
  const etiquetas = {
    combos: precios.length && `Desde ${formatoPrecio(Math.min(...precios))}`,
    ofertas: descuentos.length && `Hasta ${Math.max(...descuentos)}% OFF`,
  };
  document.querySelectorAll('[data-etiqueta]').forEach((el) => {
    if (etiquetas[el.dataset.etiqueta]) el.textContent = etiquetas[el.dataset.etiqueta];
  });

  const fotos = {
    combos: catalogo.filter((p) => p.combo && p.tendencia).concat(catalogo.filter((p) => p.combo)),
    ofertas: catalogo.filter((p) => p.oferta),
  };
  document.querySelectorAll('[data-fotos]').forEach((caja) => {
    const elegidas = [...new Set(fotos[caja.dataset.fotos].map((p) => p.fotos[0]))].slice(0, caja.dataset.fotos === 'combos' ? 1 : 2);
    caja.innerHTML = elegidas.map((src) => `<img src="${miniatura(src)}" alt="" loading="lazy" decoding="async">`).join('');
  });
}
