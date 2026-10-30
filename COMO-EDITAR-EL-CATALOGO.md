# Cómo editar el catálogo de RepZone

Los productos de la web salen de una planilla de Google. Lo que cambies ahí se ve en la web al recargar
(Google puede tardar hasta 5 minutos en actualizar).

## Armar la planilla (una sola vez)

1. Entrá a [Google Sheets](https://sheets.google.com) con la cuenta de RepZone y creá una planilla nueva.
2. **Archivo › Importar › Subir** y elegí `RepZone-catalogo.xlsx` (está en la carpeta `planillas`).
   En "Ubicación" elegí **Reemplazar hoja de cálculo**. Queda armada con colores, una sección por categoría,
   listas desplegables y una pestaña **Cómo usar** con la ayuda para el cliente.
3. **Archivo › Compartir › Publicar en la Web**: elegí la pestaña **Productos** (no "Todo el documento"),
   formato **Valores separados por comas (.csv)** y tocá **Publicar**.
4. Copiá el link que te da Google (termina en `output=csv`) y pegalo en `src/datos.js`, en `PLANILLA_CSV`.
   Subí el cambio a GitHub y Vercel publica solo.

La primera fila (los nombres de las columnas) no se cambia, y la columna `id` tiene que seguir siendo la primera.

Si algún día Google tarda o no responde, la web muestra la última copia de la planilla que guardó ese celular
o, si no hay, la copia de respaldo (`public/catalogo.csv`). Nunca queda vacía.

## Una fila = un producto

En la planilla las columnas tienen nombres para el cliente ("Producto", "Precio anterior (tachado)", "¿Hay stock?",
"Código (no tocar)"...). La web reconoce esos nombres y también los de esta tabla, que son los de `public/catalogo.csv`.
Las filas de sección (un nombre sin precio) y las filas de título de arriba no se leen como productos.

| Columna | Qué poner | Ejemplo |
| --- | --- | --- |
| `id` | Nombre corto único, sin espacios ni acentos. **No lo cambies** una vez publicado. | `star-whey-doypack-1kg` |
| `nombre` | Como lo ve el cliente | `Whey Protein doypack 1 kg` |
| `marca` | | `Star Nutrition` |
| `categoria` | Una de: `proteinas`, `creatinas`, `aminoacidos`, `pre-entrenos`, `importados`, `shakers`, `variados`, `alimentos`, `combos` | `proteinas` |
| `precio` | Solo números, sin `$` ni puntos | `76900` |
| `precio_anterior` | Si está en oferta, el precio de antes (se muestra tachado). Si no, vacío | `84400` |
| `tamaños` | Opcional. Cada tamaño con su precio, separados por `\|` | `1 kg = 76900 \| 2 kg = 139000` |
| `sabores` | Separados por `\|`. Si querés, un color para el botón | `Chocolate #5A3A22 \| Vainilla` |
| `fotos` | Un link de Google Drive (ver "Fotos" más abajo), o el nombre de un archivo de `public/productos/`. Varias con `\|` | `https://drive.google.com/file/d/…/view` |
| `beneficios` | Frases cortas con su ícono, separadas por `\|`. Si queda vacía, se muestran las de su categoría (`BENEFICIOS` en `src/config.js`) | `musculo: Ayuda a ganar músculo \| rapido: Se prepara en segundos` |
| `composicion`, `tabla_nutricional`, `modo_uso` | Texto libre (va en el desplegable de la ficha) | |
| `oferta` | `SI` para que aparezca en Ofertas | `SI` |
| `tendencia` | `SI` para destacarlo (tarjeta grande) | `NO` |
| `combo` | `SI` si es un combo | `NO` |
| `stock` | `SI` / `NO`, o una cantidad. **Con `NO` o `0` el producto se oculta solo** | `SI` |
| `nota` | Para uso interno, no se muestra | |

**Colores de los sabores:** cada sabor aparece como un botón de su color. La web lo deduce del nombre
(vainilla → crema, chocolate → marrón, frutilla → rosa, uva → violeta, limón → amarillo, etc.).
Si un sabor sale sin color o con uno que no te gusta, escribí el color al lado con `#` y un código
(lo sacás buscando "selector de color" en Google): `Cookies #8B7A6B | Banana #F2D14B`.

Íconos disponibles para los beneficios: `musculo`, `fuerza`, `energia`, `recuperacion`, `rapido`, `foco`, `fuego`,
`salud`, `corazon`, `descanso`, `articulaciones`, `hidratacion`, `calma`, `hoja`, `liviano`, `calidad`, `sabor`,
`ahorro`, `pack`, `bombeo`, `mezcla`, `practico`, `limpieza`.

## Lo más común

- **Cambiar un precio:** editá la columna `precio`.
- **Poner algo en oferta:** `oferta` en `SI`, el precio nuevo en `precio` y el de antes en `precio_anterior`.
- **Se acabó el stock:** `stock` en `NO`. Cuando vuelva, `SI`.
- **Producto nuevo:** agregá una fila dentro de su sección y completá al menos Producto, Marca, Categoría,
  Precio, ¿Hay stock? y Fotos. El código se arma solo.

## Envíos: localidades y precios

Cuando el cliente elige **Envío** en el carrito, busca su localidad en una lista y ve cuánto sale.
El costo se suma al total y va en el mensaje de WhatsApp. La lista sale de la pestaña **🚚 Envíos** de la planilla,
con el mismo formato que Productos: las localidades agrupadas bajo filas de zona (🏠 HURLINGHAM, 🌇 ZONA OESTE…).

| 📍 Localidad | 🚚 Envío (desplegable) | 💲 Precio |
| --- | --- | --- |
| Villa Tesei | Gratis | |
| Castelar | Con precio | $3.500 |
| Palermo | A cotizar | |

- **Envío:** se elige de la lista: `Gratis`, `Con precio` o `A cotizar`. El precio solo se completa con `Con precio`
  (en las otras opciones la celda se ve gris). `Con precio` sin precio cuenta como a cotizar.
- **Localidad nueva:** escribila en una fila debajo de su zona (al final hay filas vacías listas). **Sacar una:** borrá la fila.
- **Zona nueva:** una fila con el nombre en MAYÚSCULAS y Envío vacío (copiá el formato de otra zona).
- Si alguien vive en una localidad que no está en la lista, igual puede escribirla y hacer el pedido:
  le aparece el envío "a cotizar".

### Armar la pestaña (una sola vez)

1. En la planilla, **Archivo › Importar › Subir** y elegí `RepZone-envios.xlsx` (está en la carpeta `planillas`, ya trae
   las localidades, los colores y los desplegables). En "Ubicación" elegí **Insertar hojas nuevas**.
2. **Archivo › Compartir › Publicar en la Web**: elegí la pestaña **🚚 Envíos**, formato **.csv** y **Publicar**.
3. Pegá ese link en `src/envios-datos.js`, en `ENVIOS_CSV`, y subí el cambio.

Hasta que la pestaña esté publicada, la web usa la lista de `public/envios.csv` (Hurlingham gratis y el resto a cotizar).

## Códigos de descuento

El cliente escribe el código en el carrito (paso "Tu pedido") y ve el descuento antes del total.
Descuenta sobre todos los productos, **combos incluidos** (no sobre la ruleta ni el envío),
y el código y el descuento van en el mensaje de WhatsApp del pedido.

Los códigos están en `src/config.js`, en `CUPONES` (no importan las mayúsculas al escribirlo):

```js
{ codigo: 'Nico5off', porcentaje: 5, atleta: 'Nico' },
```

### Aviso al atleta

Cuando alguien manda un pedido con su código, al atleta le llega un WhatsApp avisándole. Sale por
[CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) (gratis) y hay que activarlo una vez por atleta:

1. El atleta agenda el número de CallMeBot que figura en esa página y le manda por WhatsApp
   `I allow callmebot to send me messages`. Le contesta con su **apikey** (unos números).
2. En Vercel: proyecto › **Settings › Environment Variables** › agregar `CALLMEBOT_NICO` (o `CALLMEBOT_CAMI`)
   con esa apikey, y volver a publicar (**Deployments › Redeploy**).
3. Su teléfono va en `api/aviso-cupon.js`, en `ATLETAS` (con `+54 9` adelante).

Mientras no esté activado, el código funciona igual: solo no sale el aviso.

**Atleta nuevo:** su código en `CUPONES`, su teléfono en `ATLETAS` y su apikey en Vercel (`CALLMEBOT_` + su nombre).

## Fotos (sin depender de nadie)

1. En Google Drive, una sola vez: creá una carpeta "Fotos RepZone" › **Compartir** › Acceso general:
   **Cualquier persona con el enlace** (Lector). Todo lo que subas ahí queda visible para la web.
2. Subí la foto a esa carpeta.
3. Tocá los tres puntos de la foto › **Compartir › Copiar vínculo**.
4. Pegá ese link en la columna **Fotos** del producto. La web lo convierte sola y pide el tamaño justo
   (chica en el catálogo, grande en la foto ampliada).

Consejo: las fotos se ven mucho mejor **sin fondo** (PNG o WEBP transparente), **cuadradas** (mismo ancho que alto)
y de **1600 × 1600 px** (mínimo 800 × 800). Con el producto centrado y sin mucho espacio vacío alrededor.
Si una foto tiene fondo blanco, se va a ver el recuadro blanco sobre el fondo oscuro de la web:
pasásela a Desde Cero para recortarla.
