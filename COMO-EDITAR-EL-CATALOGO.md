# Cómo editar el catálogo de RepZone

Los productos de la web salen de una planilla de Google. Lo que cambies ahí se ve en la web al recargar
(Google puede tardar hasta 5 minutos en actualizar).

## Armar la planilla (una sola vez)

1. Entrá a [Google Sheets](https://sheets.google.com) con la cuenta de RepZone y creá una planilla nueva.
2. **Archivo › Importar › Subir** y elegí `public/catalogo.csv` (está en esta carpeta).
   En "Ubicación" elegí **Reemplazar hoja de cálculo**.
3. **Archivo › Compartir › Publicar en la Web**: elegí la hoja, formato **Valores separados por comas (.csv)** y tocá **Publicar**.
4. Copiá el link que te da Google y pasáselo a Desde Cero: va en `src/datos.js`, en `PLANILLA_CSV`.

Si algún día Google no responde, la web muestra la copia de respaldo (`public/catalogo.csv`), así que nunca queda vacía.

## Una fila = un producto

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
| `fotos` | Nombre del archivo en `public/productos/`, o un link a una imagen. Varias con `\|` | `star-whey-doypack-1kg.webp` |
| `beneficios` | Frases cortas con su ícono, separadas por `\|` | `musculo: Ayuda a ganar músculo \| rapido: Se prepara en segundos` |
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
- **Producto nuevo:** agregá una fila. Para la foto, subila a cualquier lado que dé un link directo a la imagen
  o pasásela a Desde Cero para sumarla a la web.
