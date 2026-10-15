# TP 2 — API de stock

Un `openapi.yaml` que describe una API de gestión de stock donde el stock de un producto no se edita: se deriva de movimientos. Cinco endpoints, tres paths, sin nada implementado: el entregable es el contrato.

## Cómo se lee

Pegar el contenido de [openapi.yaml](openapi.yaml) en [editor.swagger.io](https://editor.swagger.io). Aparece la documentación navegable del lado derecho, con cada endpoint desplegable.

## Qué me propuse construir

Un backend de stock donde la decisión de fondo no fuera la forma de los paths sino **qué es estado y qué es historia**. La forma ingenua de modelar stock es un campo `stock` en el producto que se pisa con un `PATCH`. Funciona hasta que alguien pregunta por qué hay 34 unidades y no 40, y no hay nada que lo explique.

Acá el stock es un número calculado: la suma de los movimientos de entrada, salida y ajuste de ese producto. El contrato está armado para que no haya otra forma de cambiarlo.

## Decisiones que tomé yo

**No existe PUT ni PATCH de stock.** `stock` aparece en `Product` como `readOnly` y no está en `ProductInput`. Si se pudiera escribir directamente, el historial de movimientos dejaría de explicar el número, y un stock que no se puede explicar no sirve para auditar.

**Los movimientos son inmutables.** `/products/{productId}/movements` sólo tiene GET y POST: no hay forma de editar ni borrar un movimiento. Si se cargó mal una entrada, se registra un `adjustment` que la compensa, como un contraasiento en contabilidad. El error queda a la vista, y la corrección también.

**El producto nace con stock 0.** `POST /products` no acepta un stock inicial; para cargarlo se registra un movimiento `in`. Si no, el stock inicial sería el único número del sistema sin un movimiento detrás.

**422 y no 409 cuando no alcanza el stock.** Una salida de 5 con 3 en stock es un pedido bien formado (no es 400) que viola una regla de negocio. El 409 lo reservo para conflictos con algo que ya existe: un `sku` repetido o una `Idempotency-Key` reusada con otro body.

**`Idempotency-Key` en el POST de movimientos.** Si la red corta después de que el servidor registró una salida y el cliente reintenta, sin la key se registran dos salidas. Con la key, el reintento devuelve el movimiento original. Es opcional porque el cliente decide si su operación lo necesita.

**`product_id` sólo en el path.** `MovementInput` no lo tiene: el producto ya viene en `/products/{productId}/movements`. El path identifica y el body transporta contenido nuevo.

**`stock_after` en cada movimiento.** Es una foto del stock después de ese movimiento. Sirve para ver el resultado del POST sin hacer un segundo GET, y vuelve legible el historial: cada fila dice cómo quedó.

**404 en los movimientos de un producto inexistente, no lista vacía.** `[]` diría que el producto existe y nunca se movió, que es otra situación.

## Qué salió mal y cómo lo corregí

En el prompt 1 pedí 422 "si una salida deja el stock en negativo". Pero un `adjustment` también puede ser negativo (una rotura, un faltante en el conteo), y con esa redacción un ajuste de −50 sobre 10 unidades dejaba el stock en −40 sin que el contrato lo prohibiera. La regla no es "las salidas no pueden superar el stock", es **"el stock nunca es negativo"**, y el tipo de movimiento da igual. El 422 quedó definido así, y `stock` y `stock_after` tienen `minimum: 0`.

La segunda ambigüedad era la misma `quantity`: un entero sin más deja pasar una entrada de −5, que en realidad es una salida disfrazada. Quedó validado por tipo: `in` y `out` piden `quantity >= 1` y `adjustment` acepta cualquier valor distinto de 0.

## Prompts

El registro completo está en [prompts.md](prompts.md).
