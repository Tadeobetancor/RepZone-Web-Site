// Datos del negocio que no son productos. Los productos van en la planilla (Parte 3).

// Un solo número para toda la página: pedidos del carrito y consultas (11 6115-6883)
export const WHATSAPP = '5491161156883';

// Ruleta del carrito: cada giro se suma al pedido y siempre toca un premio; se puede girar las veces que se quiera.
// Se maneja desde la pestaña "Ruleta" de la planilla (ruleta-datos.js); esto es lo que se usa si la planilla no responde.
// "color" decide qué tan seguido sale: el % de cada color se reparte en partes iguales entre sus premios.
// "codigo" va en el mensaje de WhatsApp para identificar el premio.
export const RULETA = {
  activa: true,
  precio: 3500,
  porcentajes: { verde: 75, amarillo: 20, rojo: 5 },
  premios: [
    { nombre: 'Pasta de maní 1 kg', marca: 'Entrenuts', color: 'rojo', codigo: 'RZ100', foto: 'entrenuts-pasta-mani-1kg.webp' },
    { nombre: 'Puff snack', marca: 'Entrenuts', color: 'verde', codigo: 'RZ50', foto: 'entrenuts-puff-snack.webp' },
    { nombre: 'Barritas de proteína', marca: 'Integra', color: 'amarillo', codigo: 'RZ65', foto: 'integra-barritas-10.webp' },
    { nombre: 'Pasta de maní 370 g', marca: 'Entrenuts', color: 'verde', codigo: 'RZ30', foto: 'entrenuts-pasta-mani-370.webp' },
    { nombre: 'Bebida con 15 g de proteína', marca: 'Baly', color: 'verde', codigo: 'RZ80', foto: 'baly-bebida-proteina.webp' },
    { nombre: 'Amino Energy', marca: 'Optimum Nutrition', color: 'rojo', codigo: 'RZ150', foto: 'on-amino-energy.webp' },
    { nombre: 'Barritas de proteína', marca: 'Entrenuts', color: 'amarillo', codigo: 'RZ10', foto: 'entrenuts-barrita-proteina.webp' },
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
  { id: 'alimentos', nombre: 'Alimentos saludables' },
  { id: 'variados', nombre: 'Variados' },
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
