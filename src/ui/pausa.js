// Las animaciones que no paran (franja, ganchos, focos, fotos de clientes) se pausan
// mientras su sección no está a la vista: así el celular no trabaja dibujando lo que nadie ve.
// Con el menú o un panel abierto se pausa toda la página de abajo (ver base.css).
export function iniciarPausa() {
  if (!document.documentElement.classList.contains('con-movimiento')) return;
  const observador = new IntersectionObserver(
    (entradas) => entradas.forEach((e) => e.target.classList.toggle('fuera', !e.isIntersecting)),
    { rootMargin: '100px 0px' },
  );
  document.querySelectorAll('[data-anima]').forEach((el) => observador.observe(el));
}
