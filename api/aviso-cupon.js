// Aviso al atleta cuando alguien manda un pedido con su código de descuento (función de Vercel).
// El carrito la llama al tocar "Enviar pedido por WhatsApp". El WhatsApp sale por CallMeBot (gratis):
// cada atleta lo activa una vez desde su celular y su clave va en las variables de entorno de Vercel
// (ver COMO-EDITAR-EL-CATALOGO.md). Los teléfonos quedan acá y no llegan a la página.
import { CUPONES } from '../src/config.js';

// Por atleta (el nombre de CUPONES): su WhatsApp con código de país y la variable de Vercel con su clave
const ATLETAS = {
  Nico: { telefono: '+5491168062516', clave: 'CALLMEBOT_NICO' },
  Cami: { telefono: '', clave: 'CALLMEBOT_CAMI' },
};

const precio = (n) => '$' + Math.max(0, Math.round(Number(n) || 0)).toLocaleString('es-AR');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let datos = req.body;
  if (typeof datos === 'string') {
    try {
      datos = JSON.parse(datos);
    } catch {
      datos = {};
    }
  }
  const codigo = String(datos?.codigo || '').toLowerCase();
  const cupon = CUPONES.find((c) => c.codigo.toLowerCase() === codigo);
  if (!cupon) return res.status(404).json({ ok: false });

  const atleta = ATLETAS[cupon.atleta];
  const apikey = atleta && process.env[atleta.clave];
  // todavía sin activar: el pedido sigue igual, solo no sale el aviso
  if (!atleta?.telefono || !apikey) return res.status(200).json({ ok: false, motivo: 'aviso sin configurar' });

  const texto = [
    `⚠️ ¡Hola ${cupon.atleta}! Alguien acaba de usar tu código de descuento *${cupon.codigo}* en RepZone.`,
    datos.descuento ? `Pedido de ${precio(datos.total)} con ${precio(datos.descuento)} de descuento.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(atleta.telefono)}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(apikey)}`;
  try {
    const r = await fetch(url);
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
