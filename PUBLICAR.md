# Publicar la web de RepZone

La web es estática: se compila una vez y se sube a [Netlify](https://www.netlify.com) (gratis, con HTTPS).

## Opción rápida (arrastrar y soltar)

1. En esta carpeta, correr `npm run build`. Se crea la carpeta `dist`.
2. Entrar a <https://app.netlify.com/drop> con la cuenta de Netlify.
3. Arrastrar la carpeta `dist` a la página. En un minuto da un link tipo `https://algo.netlify.app`.
4. Para actualizar: volver a correr `npm run build` y arrastrar `dist` de nuevo en **Deploys** del mismo sitio.

## Opción recomendada (se actualiza sola)

1. Subir esta carpeta a un repositorio de GitHub (sin `node_modules` ni `dist`: ya están en `.gitignore`).
2. En Netlify: **Add new site › Import an existing project › GitHub** y elegir el repositorio.
   La configuración ya está en `netlify.toml`, no hay que tocar nada.
3. Cada cambio que se suba a GitHub se publica solo.

## Dominio propio

En Netlify: **Domain management › Add a domain** (por ejemplo `repzone.com.ar`) y seguir los pasos para
apuntar el dominio. El certificado HTTPS se genera solo.

## Antes de publicar, revisar

- `src/config.js`: horarios reales, fotos de clientes (`CLIENTES`) y logo/link de Desde Cero (`DESDE_CERO`).
- `src/datos.js`: el link de la planilla de Google en `PLANILLA_CSV`.

Los cambios de precios y stock **no** requieren volver a publicar: salen de la planilla.
