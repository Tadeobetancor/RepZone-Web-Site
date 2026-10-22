import { cargarCatalogo, formatoPrecio } from '../datos.js';

const flecha = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const PAUSA = 4500;

export async function iniciarHero() {
  const pista = document.getElementById('carrusel-pista');
  const puntos = document.getElementById('carrusel-puntos');
  const combos = (await cargarCatalogo()).filter((p) => p.combo && p.precio && p.fotos.length);


  pista.innerHTML = combos
    .map(
      (c, i) => `
      <article class="combo" data-id="${c.id}" aria-roledescription="tarjeta" aria-label="${i + 1} de ${combos.length}">
        <div class="combo-foto"><img src="${c.fotos[0]}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async"></div>
        <div class="combo-info">
          <span class="combo-marca">${c.marca}</span>
          <h2 class="combo-nombre">${c.nombre}</h2>
          <span class="combo-precio">${formatoPrecio(c.precio)}</span>
          <button class="combo-ver" type="button" aria-label="Ver ${c.nombre}">${flecha}</button>
        </div>
      </article>`,
    )
    .join('');
  puntos.innerHTML = combos.map((c, i) => `<button type="button" aria-label="Ir al combo ${i + 1}"></button>`).join('');

  const tarjetas = [...pista.children];
  const botones = [...puntos.children];
  let actual = 0;
  const ant = document.getElementById('carrusel-ant');
  const sig = document.getElementById('carrusel-sig');

  const ir = (i) => {
    const t = tarjetas[(i + tarjetas.length) % tarjetas.length];
    pista.scrollTo({ left: t.offsetLeft - tarjetas[0].offsetLeft, behavior: 'smooth' });
  };

  // La tarjeta activa es la que quedó alineada al inicio de la pista
  const marcar = () => {
    const x = pista.scrollLeft;
    let mejor = 0;
    tarjetas.forEach((t, i) => {
      if (Math.abs(t.offsetLeft - tarjetas[0].offsetLeft - x) < Math.abs(tarjetas[mejor].offsetLeft - tarjetas[0].offsetLeft - x)) mejor = i;
    });
    // al final de la pista la última tarjeta no llega al inicio: se marca la última
    if (x + pista.clientWidth >= pista.scrollWidth - 4) mejor = tarjetas.length - 1;
    actual = mejor;
    tarjetas.forEach((t, i) => t.classList.toggle('activa', i === mejor));
    botones.forEach((b, i) => b.setAttribute('aria-current', String(i === mejor)));
    // cada flecha se muestra solo si hay más combos hacia ese lado
    ant.hidden = x <= 4;
    sig.hidden = x + pista.clientWidth >= pista.scrollWidth - 4;
  };
  let cuadro;
  pista.addEventListener('scroll', () => {
    cancelAnimationFrame(cuadro);
    cuadro = requestAnimationFrame(marcar);
  }, { passive: true });
  marcar();

  botones.forEach((b, i) => b.addEventListener('click', () => ir(i)));
  pista.addEventListener('click', (e) => {
    const t = e.target.closest('.combo');
    if (t) dispatchEvent(new CustomEvent('abrir-producto', { detail: t.dataset.id }));
  });
  ant.addEventListener('click', () => ir(Math.max(0, actual - 1)));
  sig.addEventListener('click', () => ir(Math.min(tarjetas.length - 1, actual + 1)));
  addEventListener('resize', marcar);

  // Avanza solo; se pausa mientras la persona lo toca, lo mira con el mouse o no está a la vista
  if (!document.documentElement.classList.contains('con-movimiento')) return;
  const carrusel = document.getElementById('carrusel');
  let reloj;
  let visible = true;
  let tocando = false;
  const programar = () => {
    clearTimeout(reloj);
    if (visible && !tocando) reloj = setTimeout(() => ir(actual + 1), PAUSA);
  };
  pista.addEventListener('scrollend', programar);
  carrusel.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && ((tocando = true), clearTimeout(reloj)));
  carrusel.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && ((tocando = false), programar()));
  pista.addEventListener('touchstart', () => ((tocando = true), clearTimeout(reloj)), { passive: true });
  pista.addEventListener('touchend', () => ((tocando = false), programar()), { passive: true });
  new IntersectionObserver(([e]) => ((visible = e.isIntersecting), programar())).observe(carrusel);
}
