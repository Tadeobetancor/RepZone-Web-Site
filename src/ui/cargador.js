import { gsap } from 'gsap';

// Pantalla de carga: el logo aparece grande en el centro, la pesa se carga disco por disco
// y después el logo viaja a su lugar en el centro de la barra mientras la página aparece.
// Se ve cada vez que se abre la página; tocar la pantalla la saltea.
export function iniciarCargador() {
  const raiz = document.documentElement;
  const cargador = document.getElementById('cargador');
  if (!raiz.classList.contains('cargando')) {
    cargador.remove();
    return Promise.resolve();
  }

  const logo = document.getElementById('cargador-logo');
  const destino = document.getElementById('barra-logo');
  const escenario = cargador.querySelector('.escenario');
  const texto = logo.querySelector('.lv-texto');
  const pesa = logo.querySelector('.lv-pesa');
  const eje = logo.querySelector('.lv-eje');
  const barra = logo.querySelector('.lv-barra');
  const discos = [...logo.querySelectorAll('.lv-disco')];
  const tope = logo.querySelector('.lv-tope');
  // Recorrido de cada disco: desde la punta de la barra hasta su lugar (en % del ancho del logo)
  const recorrido = [22, 18, 15];

  return new Promise((listo) => {
    const terminar = () => {
      // el logo de la barra aparece de golpe justo debajo del que viajó: con fundido se veía un parpadeo
      const img = destino.querySelector('img');
      img.style.transition = 'none';
      raiz.classList.remove('cargando');
      cargador.remove();
      getComputedStyle(img).opacity; // aplica la opacidad nueva sin transición
      img.style.transition = '';
      dispatchEvent(new CustomEvent('carga-lista'));
      listo();
    };

    const tl = gsap.timeline({ paused: true, onComplete: terminar });

    tl.fromTo(texto, { opacity: 0, xPercent: -10, skewX: -14, filter: 'blur(12px)' }, { opacity: 1, xPercent: 0, skewX: 0, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out' })
      .fromTo([eje, barra], { opacity: 0, xPercent: -4 }, { opacity: 1, xPercent: 0, duration: 0.35, ease: 'power2.out' }, 0.15);

    discos.forEach((disco, i) => {
      const t = 0.3 + i * 0.28;
      tl.fromTo(disco, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t)
        .fromTo(disco, { xPercent: recorrido[i] }, { xPercent: 0, duration: 0.32, ease: 'power2.in' }, t)
        // el golpe: toda la pesa se mueve apenas y vuelve
        .to(pesa, { xPercent: -0.6, duration: 0.05, ease: 'power1.out' }, t + 0.32)
        .to(pesa, { xPercent: 0, duration: 0.25, ease: 'elastic.out(1, 0.5)' }, t + 0.37);
    });

    // el tope traba los discos apenas cae el último; el tramo de barra que tapan se apaga
    const ultimo = 0.3 + (discos.length - 1) * 0.28 + 0.32;
    tl.fromTo(tope, { opacity: 0, xPercent: 3 }, { opacity: 1, xPercent: 0, duration: 0.22, ease: 'back.out(3)' }, ultimo)
      .to(eje, { opacity: 0, duration: 0.15 }, ultimo)
      // una pausa corta con la pesa ya cargada y pasa a la página
      .addLabel('viaje', ultimo + 0.22 + 0.3);

    // El viaje se calcula recién al llegar, por si cambió el tamaño de la pantalla
    tl.add(() => {
      const o = logo.getBoundingClientRect();
      const d = destino.getBoundingClientRect();
      const s = Math.min(d.width / o.width, d.height / o.height);
      gsap.to(logo, {
        x: d.left + (d.width - o.width * s) / 2 - o.left,
        y: d.top + (d.height - o.height * s) / 2 - o.top,
        scale: s,
        transformOrigin: '0 0',
        duration: 0.7,
        ease: 'power3.inOut',
      });
    }, 'viaje')
      .to(cargador, { backgroundColor: 'rgb(10 10 11 / 0)', duration: 0.5, ease: 'power2.in' }, 'viaje+=0.1')
      .to(escenario, { opacity: 0, scale: 1.06, duration: 0.5, ease: 'power2.in' }, 'viaje')
      .from('#contenido', { opacity: 0, y: 40, duration: 0.6, ease: 'power3.out', clearProps: 'all' }, 'viaje+=0.25')
      .to({}, { duration: 0.7 }, 'viaje');

    // Arranca cuando las piezas del logo ya están cargadas
    const imgs = [...logo.querySelectorAll('img')];
    Promise.all(imgs.map((img) => img.decode().catch(() => {}))).then(() => tl.play());

    // Tocar o apretar una tecla saltea la carga
    const saltear = () => tl.progress() < 0.95 && tl.progress(1);
    cargador.addEventListener('click', saltear);
    addEventListener('keydown', saltear, { once: true });
  });
}
