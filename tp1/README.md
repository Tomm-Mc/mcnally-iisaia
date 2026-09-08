# TP 1 — Contraseña de ruleta tragamonedas

Un formulario de creación de contraseña donde cada carácter se elige girando una ruleta tragamonedas, no tipeando ni haciendo click sobre letras.

## Cómo se ejecuta

Doble click en `index.html`. Sin dependencias

## Decisiones que tomé yo

**DOM en vez de `<canvas>`.** La tira es una lista de divs desplazada con `transform: translateY`, y se puede inspeccionar el offset y su reflejo visual al mismo tiempo.

**El set de 41 caracteres se mezcla una sola vez, al cargar la página.** No en cada giro. El orden queda fijo durante todo el intento, así que después de un par de vueltas se podría ubicar dónde está la letra que se quiere elegir. Sirve como ayuda teniendo en cuenta el delay de parada.

**"Borrar último" en vez de reiniciar todo.** Mantiene la frustración en la ruleta, no obliga a reiniciar en caso de faltar un requisito de contraseña.

## Qué salió mal y cómo lo corregí

Después del primer prompt el frenado se sentía correcto pero brusco: la tira paraba en seco apenas calculaba qué carácter quedaba más cerca del centro. El segundo prompt pedía dos cosas a la vez en el mismo texto: una animación de frenado con ease-out en vez de un corte seco, y que el destino final fuera 4 posiciones más adelante de donde frenarías en seco, simulando inercia.

Eso último no era necesario para resolver lo que quería arreglar (la brusquedad) y trajo un efecto que agrega mayor complejidad en el uso: el carácter que termina entrando ya no depende de cuándo apretás "Frenar" sobre el carácter que ves, sino de uno que en ese momento ni siquiera está en el centro. La ruleta se volvió más una tragamonedas real donde no se controla el resultado y menos una interfaz que se puede operar con puntería.

## Prompts

El registro completo está en [prompts.md](prompts.md). El primero fija el artefacto entero —estructura, estilo y estado como constraints separados—; el segundo es el utilizado para corregir el movimiento del tragamonedas
