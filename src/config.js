// Datos del negocio que no son productos. Los productos van en la planilla (Parte 3).

export const WHATSAPP = '5491124726060';
export const INSTAGRAM = 'https://www.instagram.com/repzone.arg/';

export const CATEGORIAS = [
  { id: 'proteinas', nombre: 'Proteínas' },
  { id: 'creatinas', nombre: 'Creatinas' },
  { id: 'aminoacidos', nombre: 'Aminoácidos' },
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
