# Publicar la web de RepZone

La web es estática: se compila con Vite y se publica en [Vercel](https://vercel.com) (gratis, con HTTPS).
El código está en GitHub: <https://github.com/Tadeobetancor/RepZone-Web-Site>.

## Primera vez

1. Entrar a <https://vercel.com/new> con la cuenta de GitHub.
2. **Import Git Repository** › elegir `RepZone-Web-Site` › **Deploy**.
   La configuración ya está en `vercel.json`, no hay que tocar nada.

## Actualizar

Cada cambio que se sube a GitHub se publica solo en un minuto.

Al compilar (`npm run build`) se generan solas las fotos chicas de `public/productos/400/`
(`scripts/miniaturas.mjs`): para sumar un producto con foto alcanza con poner la foto en `public/productos/`.

## Dominio propio

En Vercel: proyecto › **Settings › Domains** (por ejemplo `repzone.com.ar`) y seguir los pasos para
apuntar el dominio. El certificado HTTPS se genera solo.

## Antes de publicar, revisar

- `src/config.js`: horarios reales, fotos de clientes (`CLIENTES`) y logo/link de Desde Cero (`DESDE_CERO`).
- `src/datos.js`: el link de la planilla de Google en `PLANILLA_CSV` (ver `COMO-EDITAR-EL-CATALOGO.md`).

Los cambios de precios y stock **no** requieren volver a publicar: salen de la planilla.

