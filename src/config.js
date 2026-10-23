// Datos del negocio que no son productos. Los productos van en la planilla (Parte 3).

export const WHATSAPP = '5491124726060';
// A este número llegan los pedidos del carrito (11 6115-6883)
export const WHATSAPP_PEDIDOS = '5491161156883';

// Ruleta del carrito: cada giro se suma al pedido y siempre toca un premio; se puede girar las veces que se quiera.
// "peso" = el % de veces que sale cada premio (suman 100).
//   verde: 21,5 (frecuente) · amarillo: 8 (poco) · rojo: 3 (difícil)
// "foto" = archivo de public/productos/ que se ve en la rueda; sin foto, se ve el nombre.
export const RULETA = {
  precio: 3500,
  premios: [
    { nombre: 'Pasta de maní 1 kg', marca: 'Entrenuts', rueda: ['PASTA DE MANÍ', '1 KG · ENTRENUTS'], foto: 'entrenuts-pasta-mani-1kg.webp', peso: 3 },
    { nombre: 'Puff snack', marca: 'Entrenuts', rueda: ['PUFF SNACK', 'ENTRENUTS'], foto: 'entrenuts-puff-snack.webp', peso: 21.5 },
    { nombre: 'Barritas de proteína', marca: 'Integra', rueda: ['BARRITAS', 'INTEGRA'], foto: 'integra-barritas-10.webp', peso: 21.5 },
    { nombre: 'Pasta de maní 370 g', marca: 'Entrenuts', rueda: ['PASTA DE MANÍ', '370 G · ENTRENUTS'], foto: 'entrenuts-pasta-mani-370.webp', peso: 21.5 },
    { nombre: 'Bebida con 15 g de proteína', marca: 'Baly', rueda: ['BEBIDA BALY', '15 G PROTEÍNA'], foto: 'baly-bebida-proteina.webp', peso: 8 },
    { nombre: 'Amino Energy', marca: 'Optimum Nutrition', rueda: ['AMINO ENERGY', 'OPTIMUM NUTRITION'], foto: 'on-amino-energy.webp', peso: 3 },
    { nombre: 'Barritas de proteína', marca: 'Entrenuts', rueda: ['BARRITAS', 'ENTRENUTS'], foto: 'entrenuts-barrita-proteina.webp', peso: 21.5 },
  ],
};
export const INSTAGRAM = 'https://www.instagram.com/repzone.arg/';

export const CATEGORIAS = [
  { id: 'proteinas', nombre: 'Proteínas' },
  { id: 'creatinas', nombre: 'Creatinas' },
  { id: 'omega3', nombre: 'Omega 3' },
  { id: 'pre-entrenos', nombre: 'Pre-entrenos' },
  { id: 'importados', nombre: 'Importados' },
  { id: 'shakers', nombre: 'Shakers' },
  { id: 'variados', nombre: 'Variados' },
  { id: 'alimentos', nombre: 'Alimentos saludables' },
];

export const linkWhatsApp = (texto = '¡Hola RepZone! Tengo una consulta.') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;


// Reels y publicaciones de Instagram que se muestran arriba de las fotos de clientes.
// Para cambiarlos: pegar acá el link de cada publicación (el de "Copiar enlace" en Instagram).
export const REELS = [
  'https://www.instagram.com/p/Deu-C6FGuoV/',
  'https://www.instagram.com/reel/Dek25SbTfsk/',
  'https://www.instagram.com/p/DdIALsuTaZZ/',
];

// Fotos de clientes frecuentes para el carrusel del pie: archivos en public/clientes/
export const CLIENTES = Array.from({ length: 12 }, (_, i) => `cliente-${String(i + 1).padStart(2, '0')}.webp`);

// Firma de la agencia al final del pie
export const DESDE_CERO = {
  logo: 'logo-desdecero.png',
  // el logo lleva a la cuenta de la agencia; el usuario, a la del diseñador
  instagramAgencia: 'https://www.instagram.com/desdecero.labs/',
  instagram: 'https://www.instagram.com/tadeobetancor_/',
  usuario: '@tadeobetancor_',
};
