# Prompts — TP 1

Basado en el prompt de source_material se busco armar un formulario de creación de contraseña donde cada caracter haya que cargarlo con una ruleta tragamonedas

---

## 1 — Prompt inicial

```
Construí un formulario de creación de contraseña donde cada carácter se elige con una ruleta tragamonedas, no tipeando ni haciendo click sobre letras.

Estructura:

- <header> con el título "Crear contraseña" y los requisitos, visibles todo el tiempo: "Debe tener exactamente 6 caracteres, incluyendo al menos 1 letra, 1 número y 1 símbolo (! @ # $ %)".

- <main> con la ruleta: una ventana rectangular con overflow oculto que muestra 5 filas de caracteres apiladas verticalmente. La fila del medio es la "seleccionada". El set de caracteres de la ruleta es fijo: A-Z, 0-9, !@#$% (41 caracteres en total), en un orden mezclado una sola vez al cargar la página, repetido varias veces para que el loop sea continuo.

- <footer> con la contraseña armada hasta ahora (6 casilleros, los vacíos se ven como cuadrados vacíos con borde), un <button> "Girar", un <button> "Frenar" y un <button> "Borrar último".

Estilo:

- Estética de casino: fondo amarillo fuerte, bordes duros (sin border-radius en ningún elemento), tipografía LHF Chicago Script.

- Cada fila de la ruleta mide exactamente 40px de alto.

- La fila "seleccionada" (la del medio) debe agregar un borde al caracter en color rojo brillante.

- Los casilleros de la contraseña armada son cuadrados chicos con borde, con color dorado de fondo y letra en negrita color verde

Comportamiento:

- Estado: entered (array de caracteres, máximo 6), girando (booleano), offset (posición vertical actual de la tira de caracteres, en px, como número flotante).

- Al click en "Girar": si girando es false y entered tiene menos de 6 caracteres, arranca el movimiento. La tira se desplaza verticalmente a velocidad constante (40px cada 90ms, o sea aproximadamente 0.444 px/ms) usando requestAnimationFrame con acumulación de deltaTime, en loop infinito (cuando offset supera la altura total de la tira repetida, vuelve a 0 sin que se note el salto). Mientras girando es true, "Girar" queda deshabilitado.

- Al click en "Frenar": solo tiene efecto si girando es true. Cancela la animación, calcula qué carácter queda más cerca del centro de la ventana según el offset actual, hace que la tira "snapee" visualmente a esa posición exacta (con animación de frenado gradual), agrega ese carácter a entered, y pone girando en false.

- Al click en "Borrar último": saca el último carácter de entered. Funciona siempre que entered tenga al menos un carácter, sin importar si está girando o no.

- Cuando entered llega a 6 caracteres: comparar contra los requisitos (al menos 1 letra, 1 número, 1 símbolo de !@#$%) y mostrar en el footer si la verificación pasó o falló. Si falló, indicar cuál regla no se cumplió. Mostrar un botón "Reiniciar" que vacía entered, vuelve a mezclar el orden de la ruleta y permite volver a girar.

Constraints:

- Un solo archivo HTML, con el CSS en un <style> y el JS en un <script>.

- Vanilla JS, sin frameworks ni dependencias externas.

- La ruleta y sus caracteres son elementos del DOM posicionados con CSS (transform/translateY). No usar <canvas>: el estado tiene que verse reflejado en el DOM. 


```

**Qué intentaba lograr:** al igual que en el prompt de ejemplo, intentaba obtener el artefacto entero de una sola vez, nombrando las cinco capas — estructura con etiquetas semánticas, estilo, comportamiento expresado como estado, y constraints de empaque.

**Qué devolvió:** el formulario funcionando, con la máquina tragamonedas funcionando. Respetó los tres constraints: un solo archivo, sin dependencias y no tiene elementos `<canvas>`.

**Qué hice con eso:** me parece correcto pero me gustaría especificar mejor el movimiento durante el frenado de la máquina ya que parece muy brusco, debería tener una animación de parada más suave.

---

## 2 — Modificar el frenado

```
Al click en "Frenar": solo tiene efecto si girando es true. Lo primero que hace es deshabilitar el botón "Frenar" hasta que termine todo el proceso de desaceleración, para que no se pueda apretar dos veces.

A partir del offset actual, se calcula qué carácter quedaría en el centro si la tira se detuviera ahí mismo, pero ese no es el destino final: el destino real es 4 posiciones más adelante en el sentido del giro, como si la rueda tuviera inercia y seleccionara caracteres seguido de ese, así que el frenado. La tira recorre esa distancia extra con una animación de desaceleración tipo "ease-out" (rápida al principio, cada vez más lenta, como una tragamonedas real) durante 1500ms, en vez de detenerse en seco.

Recién cuando termina esa animación de frenado: se agrega el carácter donde finalmente quedó centrada la tira a entered, girando pasa a false, y "Frenar" se vuelve a habilitar (si corresponde, es decir, si entered todavía tiene menos de 6 caracteres). 


```

**Qué intentaba lograr:** Mejorar el efecto de frenado del tragamonedas.

**Qué devolvió:** el tragamonedas funcionando y de una forma mucho más irritante ya que no depende del momento en el cual el usuario frena el tragamonedas, sino del posible caracter que puede estar 4 valores más abajo.

---

## 3 — Next Step - Agregar encapsulamiento a la creación de contraseña - Ej: Login Form