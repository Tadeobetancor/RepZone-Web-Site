// Franja de envío: misma velocidad en cualquier pantalla, lenta para que siempre se pueda leer
const PX_POR_SEGUNDO = 35;

export function iniciarFranja() {
  const pista = document.querySelector('.franja-pista');
  if (!pista) return;
  const medir = () => {
    // la pista tiene el texto duplicado: recorre la mitad y vuelve a empezar sin salto
    const recorrido = pista.scrollWidth / 2;
    pista.style.setProperty('--duracion', `${Math.round(recorrido / PX_POR_SEGUNDO)}s`);
  };
  medir();
  document.fonts?.ready.then(medir);
}
