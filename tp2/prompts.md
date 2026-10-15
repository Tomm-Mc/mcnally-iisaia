# Prompts — TP 2

El registro del proceso, en orden. Tres prompts en una sola conversación. El contrato quedó terminado en el tercero.

---

## 1 — Prompt inicial

```
Necesito un openapi.yaml (3.1) para una API de gestión de stock.

recursos:
  Product   { id, sku, name, unit, min_stock?, stock }
  Movement  { id, product_id, type (in | out | adjustment), quantity, reason?, created_at, stock_after }

endpoints:
  GET    /products                          → 200 lista
  POST   /products                          → 201 / 400 si falta sku, name o unit / 409 si el sku ya existe
  GET    /products/{productId}              → 200 / 404 si no existe
  GET    /products/{productId}/movements    → 200 lista / 404 si el producto no existe
  POST   /products/{productId}/movements    → 201 / 400 / 404 si el producto no existe / 422 si una salida deja el stock en negativo

El stock no se edita: lo calcula el servidor a partir de los movimientos, y un
movimiento no se modifica ni se borra. Los schemas de entrada y de salida son
distintos: el de salida incluye lo que genera el servidor (id, stock,
product_id, created_at, stock_after), el de entrada no.
```

**Qué buscaba:** fijar los cinco endpoints y, sobre todo, la idea de que el stock es un dato calculado. Si no lo digo, el modelo arma un `PATCH /products/{id}` con `stock` en el body, porque es lo más común. Por eso nombré a mano lo que genera el servidor: `stock` y `product_id` no pueden aparecer en la entrada.

**Qué volvió:** el yaml con los tres paths y `ProductInput`, `Product`, `MovementInput` y `Movement` en `components/schemas`. Venían los códigos pedidos, `stock` como `readOnly`, y ningún PUT, PATCH ni DELETE.

---

## 2 — Idempotencia

```
Agregá un header Idempotency-Key opcional al POST de movimientos: si se repite
la misma key, devuelve el movimiento original sin registrar otro.
```

**Qué buscaba:** cubrir un reintento después de un corte de red. Sin la key, una salida que el servidor ya registró se registra dos veces.

**Qué volvió:** el header documentado y un 409 para una key reusada con un body distinto. El 409 no lo había pedido y lo dejé.

---

## 3 — Corregir el 422 y la cantidad

```
El 422 no es solo para las salidas: un ajuste negativo también puede dejar el
stock por debajo de cero. La regla es que el stock nunca sea negativo. Y validá
quantity según el tipo: entradas y salidas mayores a 0, ajustes distintos de 0.
```

**Qué buscaba:** corregir un hueco que había dejado yo en el prompt 1. Ver el detalle en el [README](README.md).

---

## Conversación completa

Una sola conversación, sin reiniciar el hilo. El yaml final tiene 5 endpoints repartidos en 3 paths.
