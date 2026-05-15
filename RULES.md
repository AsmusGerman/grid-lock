# NEXUS — Reglas v2

## Visión general

NEXUS es un juego de estrategia abstracta por turnos para 2 jugadores en un tablero de 7×7. Los jugadores construyen redes dirigidas de nodos para maximizar su puntuación. Diseñado para jugadores con perfil Go/ajedrez: cada movimiento tiene peso, las amenazas son diferidas, y ningún estilo de juego domina.

---

## Objetivo

Construir y controlar una red de nodos conectados mientras se bloquea y disrumpe la red del oponente. Gana el jugador con mayor puntuación al final de la partida.

---

## El tablero y los nodos

- El área de juego es una **cuadrícula 7×7** de nodos (celdas).
- Cada nodo empieza **vacío** (sin propietario, sin conexiones).
- Un nodo pasa a ser **propio** en el momento en que una conexión lo convierte de vacío a cualquier tipo de hub.
- La **propiedad es permanente** una vez adquirida.

---

## Tipos de hub

Los nodos se clasifican automáticamente según su **in-degree** (flechas entrantes) y **out-degree** (flechas salientes). El tipo de hub de un nodo **no es visible para el oponente hasta que tiene 2 o más conexiones** — ver sección *Información oculta*.

| Hub | In | Out | Puntos |
|---|---|---|---|
| Source (SRC) | 0 | ≥1 | 1 |
| Dead-End (END) | ≥1 | 0 | 1 |
| Fork (FRK) | 1 | ≥2 | 3 |
| Join (JON) | ≥2 | 1 | 3 |
| Reactor (RCT) | ≥2 | ≥2 | 5 |

> El estado Relay (1 in / 1 out) es un estado transitorio sin categoría propia. Un nodo en estado Relay vale 0 puntos y no puede usarse como source hasta recibir otra conexión.

---

## Puntuación

Los puntos se calculan por tipo de hub al final de la partida:

- Nodos vacíos: 0 puntos.
- Nodos atrapados (X): 0 puntos.
- Nodos balanceados (in = out): 0 puntos mientras estén balanceados.
- Nodos en estado Relay transitorio: 0 puntos.
- Todos los demás: puntos según tabla de tipos de hub.

**Puntuación total = suma de puntos de todos los nodos propios.**

En caso de empate de puntos, gana el jugador con más nodos propios en el tablero. Si persiste el empate, la partida termina en tablas.

---

## Tipos de conexión

Los jugadores colocan **flechas dirigidas** (conexiones) entre nodos. Existen tres tipos:

### Normal
- Conecta dos nodos **ortogonalmente adyacentes** (arriba, abajo, izquierda, derecha).
- Sin restricciones especiales.

### Diagonal
- Conecta dos nodos **diagonalmente adyacentes** (esquina con esquina).
- **Ambos extremos deben ser nodos propios** (no vacíos, no del oponente).
- Solo disponible en **fase Expansión** (ver *Fases de juego*).
- **Efecto especial:** una conexión Diagonal entre dos nodos propios no expande territorio. En cambio, consolida la red interna y otorga **+1 punto adicional** al nodo origen, independientemente de su tipo de hub.
- Uso táctico: rescatar un nodo en riesgo de quedar balanceado, o reforzar un hub antes de que el oponente lo bloquee.

### Bridge
- Conecta dos nodos que están **exactamente 2 celdas de distancia** (solo ortogonal — horizontal o vertical).
- **Regla de trampa:** el Bridge debe unir dos nodos propios con exactamente un nodo del oponente **en el medio**.
- Cuando se juega un Bridge, el nodo central queda **atrapado (X)** y se elimina permanentemente del juego.
- Solo disponible en **fase Expansión**.

---

## Fases de juego

Las fases no se determinan por turno global, sino por el **tamaño del circuito propio de cada jugador**. Cada jugador avanza a su propia fase independientemente.

### Fase Fundación
**Condición:** el circuito propio tiene menos de 4 nodos.

- Solo se permiten conexiones **Normal**.
- El objetivo es establecer la red base con masa crítica antes de escalar.

### Fase Expansión
**Condición:** el circuito propio tiene 4 o más nodos.

- Se desbloquean las conexiones **Diagonal** y **Bridge**.
- El jugador que crece más rápido accede antes a herramientas avanzadas, pero expone su red antes.
- El jugador que crece despacio tiene más tiempo para planificar su red inicial, pero el oponente puede entrar en Expansión con ventaja táctica.

---

## Información oculta

- El **propietario** de un nodo siempre ve el tipo de hub, in-degree y out-degree de sus propios nodos.
- El **oponente** solo ve:
  - Que el nodo existe y pertenece al rival.
  - El número total de conexiones del nodo (para saber si puede recibir más).
- El tipo de hub (SRC, END, FRK, JON, RCT), el in-degree y el out-degree separados **no se revelan al oponente hasta que el nodo tiene 2 o más conexiones**.

**Efecto táctico:** el oponente ve un nodo con 1 conexión sin saber si es un Source que va a expandirse o un Dead-End ya cerrado. Debe decidir si bloquearlo ahora o esperar — incertidumbre calculable, no aleatoria.

---

## Validación de movimientos

Un movimiento es legal si y solo si:

1. **Regla de apertura:** el **primer movimiento** de cada jugador puede colocarse libremente en cualquier nodo vacío.
2. **Regla de circuito:** a partir del segundo movimiento, toda conexión debe estar **adyacente al circuito propio existente**.
3. **Verificación del nodo origen:** el nodo origen no puede ser:
   - Atrapado (X).
   - Balanceado (in = out, ambos > 0).
   - Bloqueado por long-run (≥3 conexiones consecutivas del mismo tipo en la misma dirección).
4. **Verificación del nodo destino:** el nodo destino no puede estar atrapado (X).
5. **Geometría:** el tipo de conexión debe coincidir con la distancia en la cuadrícula.
6. **Sin duplicados:** no puede existir ya una conexión en la misma dirección entre estos dos nodos.
7. **Sin inversión:** no puede existir una flecha en dirección opuesta entre estos dos nodos.
8. **Fase correcta:** las conexiones Diagonal y Bridge solo están disponibles en fase Expansión.

### Regla especial del Dead-End como origen

Si el nodo origen es un Dead-End:
- Solo puede conectar a nodos **adyacentes**.
- No puede conectar a nodos **vacíos** (el destino debe ser ya un nodo estructural).

---

## Estados especiales de nodo

### Nodos balanceados

Cuando un nodo tiene **in-degree = out-degree** (y ambos > 0):
- No puede generar nuevas flechas salientes hasta recibir otra entrada.
- Sigue siendo propio y puede recibir nuevas entradas.
- Al recibir una nueva entrada puede desbalancearse y volver a actuar.
- Vale **0 puntos** mientras esté balanceado.

### Nodos atrapados (X)

Los nodos marcados con X están eliminados permanentemente:
- Quedan atrapados cuando el oponente coloca un Bridge con este nodo en el centro.
- No pueden usarse como origen de ninguna conexión.
- No pueden recibir nuevas entradas.
- Valen **0 puntos**.
- Son **permanentemente injugables**.

---

## Flujo de turno

1. El jugador coloca **exactamente una conexión**.
2. El jugador pulsa **Listo** para terminar su turno.
   - Opcionalmente, puede pulsar **Deshacer** antes de Listo para retirar y reintentar.
3. El oponente toma su turno.

---

## Final de partida

La partida termina cuando:
- Un jugador **no tiene movimientos legales** disponibles.
- O se alcanza el **límite de 40 turnos totales**.

Cuando quedan pocas celdas libres adyacentes a cualquier circuito, la interfaz muestra una **señal de fase final** para que ambos jugadores puedan planificar el cierre.

**Ganador:** mayor puntuación. Empate de puntos → más nodos. Empate de nodos → tablas.

---

## Secuencia de ejemplo

1. **J1 (T1):** Coloca conexión Normal de (3,3) a (3,4). Nodo (3,3) = SRC. Nodo (3,4) = END. Ambos de J1. Circuito J1: 2 nodos → fase Fundación.
2. **J2 (T1):** Apertura libre en (1,1). Coloca Normal a (1,2). Circuito J2: 2 nodos → fase Fundación.
3. **J1 (T2):** Normal de (3,4) a (2,4). Circuito J1: 3 nodos → fase Fundación.
4. **J2 (T2):** Normal de (1,2) a (2,2). Circuito J2: 3 nodos → fase Fundación.
5. **J1 (T3):** Normal de (2,4) a (2,3). Circuito J1: 4 nodos → **entra en fase Expansión**.
6. **J2 (T3):** Normal de (2,2) a (2,3). Circuito J2: 4 nodos → **entra en fase Expansión**.
7. A partir de aquí ambos jugadores pueden usar Diagonal y Bridge. J1 considera un Bridge para atrapar un nodo de J2, o una Diagonal para consolidar su hub central antes de que J2 lo bloquee.

---

## Resumen de cambios respecto a v1

| Área | Cambio |
|---|---|
| Puntuación | Por tipo de hub (1/1/3/3/5) en lugar de \|in−out\| |
| Relay | Eliminado como categoría oficial — estado transitorio |
| Fases | Basadas en tamaño de red propia, no en turno global |
| Diagonal | Solo entre nodos propios, +1 punto al origen, solo en Expansión |
| Bridge | Solo en fase Expansión |
| Información | Tipo de hub oculto al oponente hasta 2 conexiones |
| Endgame | Señal visual de fase final cuando quedan pocas celdas libres |
| Desempate | Por número de nodos si hay empate de puntos |