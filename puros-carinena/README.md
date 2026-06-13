# Puros de la Comarca de Cariñena 🍇🪨🌳

Un mini-juego web estilo **Pokémon Rojo Fuego** ambientado en la comarca
vinícola de **Cariñena** (Aragón), donde empiezas tu aventura en el pueblo de
**Encinacorba**. Captura, entrena y combate con **"los puros"**: criaturas
inspiradas en la uva garnacha, las encinas, la piedra de la Sierra de Algairén,
el cierzo y el vino.

Está hecho con **HTML5 + Canvas + JavaScript vanilla**. Sin frameworks, sin
dependencias y sin paso de compilación. Todos los gráficos son **100 %
procedurales** (dibujados con `fillRect`, `arc`, etc.): no usa ninguna imagen
externa.

## Cómo abrirlo

1. Descarga la carpeta `puros-carinena` (los tres archivos `index.html`,
   `game.js` y `README.md`).
2. **Haz doble clic en `index.html`**. Se abrirá en tu navegador y podrás jugar
   directamente. No hace falta servidor ni instalación.

## Controles

| Acción          | Teclado                         | Móvil           |
|-----------------|---------------------------------|-----------------|
| Mover           | Flechas o `W A S D`             | D-pad           |
| Aceptar / Hablar (A) | `Z` o `Enter`              | Botón **A**     |
| Atrás / Cancelar (B) | `X` o `Esc`                | Botón **B**     |

Los botones táctiles (cruceta + A/B) aparecen automáticamente en móviles y
tabletas.

## Cómo se juega

1. En la **pantalla de título** verás los tres iniciales. Pulsa `Z` para
   empezar.
2. Elige tu inicial con el **Profesor Cariñena** (← →, `Z` para confirmar).
3. Explora **Encinacorba**: habla con los vecinos, lee los carteles y usa la
   **fuente de la plaza** para curar a tu equipo (acércate y pulsa A).
4. Baja a la **Ruta 1** por el hueco de la valla. En la **hierba alta**
   aparecen puros salvajes (~18 % por paso): debilítalos y lánzales un
   **cántaro** para capturarlos (¡equipo máximo de 6!).
5. Sube de nivel, aprende movimientos y evoluciona a tus puros.
6. Reta al **Gimnasio de Encinacorba** y vence al líder **Don Mosto** para
   ganar la **Medalla Garnacha**. ¡Ese es el objetivo!

> Consejo: habla con el Bodeguero para conocer la tabla de tipos. El **Vino**
> arrasa a la **Uva**, pero la **Planta** agrieta la **Piedra**...

## Los puros

### Iniciales (evolucionan a nivel 14)
| Inicial    | Tipo   | Evolución |
|------------|--------|-----------|
| Garnachín  | Uva    | Garnachón |
| Encinón    | Planta | Carrasco  |
| Pedrusco   | Piedra | Pedrolo   |

### Salvajes de la Ruta 1 (Nv 2–5)
- **Sarmiento** (Uva)
- **Cierzal** (Viento)
- **Tozalico** (Piedra)
- **Aceitón** (Planta)

### Entrenadores
- **Pastor Aniceto** (Ruta 1): Tozalico Nv6.
- **Don Mosto** — Líder del Gimnasio (tipo Vino): Mostillo Nv9 y Botijón Nv12.
  Al vencerlo entrega la **Medalla Garnacha**.

## Tipos y tabla de efectividad

Tipos: **Uva, Planta, Piedra, Viento, Vino, Normal**. Multiplicador por
defecto ×1.

- **Planta**: supereficaz vs Piedra; floja vs Viento y vs Planta.
- **Piedra**: supereficaz vs Viento; floja vs Planta y vs Piedra.
- **Viento**: supereficaz vs Planta; flojo vs Piedra y vs Viento.
- **Vino**: supereficaz vs Uva; flojo vs Vino. La **Uva** es floja vs Vino.

## Sistema de combate

- Combate por turnos, orden según la **velocidad** (empate aleatorio).
- Stats por nivel:
  - `maxHp = floor(base*nivel/50) + nivel + 10`
  - `stat  = floor(base*nivel/50) + 5` (ataque, defensa, velocidad)
- Daño:
  `floor(floor((2*nivel/5+2)*potencia*atk/def)/50)+2`, multiplicado por la
  **efectividad de tipo**, el **STAB** (×1.5 si el movimiento coincide con el
  tipo del puro) y un factor **aleatorio 0.85–1.0** (mínimo 1 si es efectivo).
- Menú: **LUCHAR / CÁNTARO (captura) / EQUIPO (cambiar) / HUIR**.
- Movimientos con **PP** (máximo 4 por puro).
- La **captura** sólo es posible en combates salvajes; la probabilidad sube
  cuanto menor sea el HP del rival.
- En combates de **entrenador** no puedes huir ni capturar.
- Al derrotar a un rival ganas EXP (`nivel_rival*6+4`), subes de nivel
  (recalculando stats y curando el HP extra), aprendes movimientos y
  evolucionas al nivel correspondiente.
- Si tu puro se debilita, eliges otro; si no te quedan, vuelves curado a la
  plaza.

## Estructura

```
puros-carinena/
├── index.html   # estructura, estilos y controles táctiles
├── game.js      # toda la lógica del juego (mundo, combate, render)
└── README.md    # este archivo
```

¡Que el cierzo sople a tu favor! 🌬️🍷
