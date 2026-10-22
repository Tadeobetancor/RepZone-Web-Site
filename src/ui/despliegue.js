import { gsap } from 'gsap';

// Cómo se despliegan los paneles (menú, ficha y carrito). Tres variantes del mismo estilo "hacia abajo":
//   persiana  → se descubre de arriba hacia abajo, como una persiana que baja
//   cortina   → cae desde arriba con una leve inclinación y se acomoda
//   acordeon  → se estira desde el borde de arriba
// Para probar otra sin tocar código: agregar ?transicion=cortina (o acordeon) a la dirección.
const PREDETERMINADA = 'cortina';
const elegida = new URLSearchParams(location.search).get('transicion');
const MODO = ['persiana', 'cortina', 'acordeon'].includes(elegida) ? elegida : PREDETERMINADA;

const reducido = () => !document.documentElement.classList.contains('con-movimiento');
const radio = (el) => getComputedStyle(el).borderTopLeftRadius || '0px';

const ENTRADA = {
  persiana: (el) => [
    { clipPath: `inset(0% 0% 100% 0% round ${radio(el)})`, y: -16 },
    { clipPath: `inset(0% 0% 0% 0% round ${radio(el)})`, y: 0, duration: 0.6, ease: 'power3.inOut' },
  ],
  cortina: () => [
    { y: -70, rotationX: -14, opacity: 0, transformOrigin: '50% 0%', transformPerspective: 1200 },
    { y: 0, rotationX: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.3)' },
  ],
  acordeon: () => [
    { scaleY: 0.05, opacity: 0.4, transformOrigin: '50% 0%' },
    { scaleY: 1, opacity: 1, duration: 0.55, ease: 'expo.out' },
  ],
};

const SALIDA = {
  persiana: (el) => ({ clipPath: `inset(0% 0% 100% 0% round ${radio(el)})`, y: -10, duration: 0.42, ease: 'power3.in' }),
  cortina: () => ({ y: -50, rotationX: -10, opacity: 0, transformOrigin: '50% 0%', transformPerspective: 1200, duration: 0.35, ease: 'power2.in' }),
  acordeon: () => ({ scaleY: 0.05, opacity: 0, transformOrigin: '50% 0%', duration: 0.35, ease: 'power3.in' }),
};

export function desplegar(panel, items = []) {
  gsap.killTweensOf([panel, ...items]);
  if (reducido()) return gsap.timeline();
  const [desde, hasta] = ENTRADA[MODO](panel);
  return gsap
    .timeline()
    .fromTo(panel, desde, { ...hasta, clearProps: 'clipPath,transform,opacity' })
    .from(items, { y: 22, opacity: 0, duration: 0.45, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.22);
}

export function plegar(panel, alTerminar) {
  gsap.killTweensOf(panel);
  if (reducido()) {
    alTerminar();
    return gsap.timeline();
  }
  return gsap.timeline({ onComplete: alTerminar }).to(panel, SALIDA[MODO](panel)).set(panel, { clearProps: 'clipPath,transform,opacity' });
}
