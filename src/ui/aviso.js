// Aviso corto abajo de la pantalla ("Se agregó al carrito · Ver carrito")
let reloj;

export function avisar(texto, { accion, alTocar } = {}) {
  let caja = document.getElementById('aviso');
  if (!caja) {
    caja = document.createElement('div');
    caja.id = 'aviso';
    caja.className = 'aviso';
    caja.setAttribute('role', 'status');
    document.body.append(caja);
  }
  caja.innerHTML = `<span class="aviso-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>
    <span class="aviso-texto"></span>${accion ? `<button type="button" class="aviso-accion">${accion}</button>` : ''}`;
  caja.querySelector('.aviso-texto').textContent = texto;
  caja.querySelector('.aviso-accion')?.addEventListener('click', () => {
    ocultar();
    alTocar?.();
  });
  caja.classList.remove('visible');
  void caja.offsetWidth;
  caja.classList.add('visible');
  clearTimeout(reloj);
  reloj = setTimeout(ocultar, 4000);

  function ocultar() {
    caja.classList.remove('visible');
  }
}
