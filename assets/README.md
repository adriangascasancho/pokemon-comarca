# Assets para Pokémon Comarca de Cariñena

Este directorio contiene los assets gráficos del juego. Todos los sprites siguen el estilo GBA con tiles de 16×16 píxeles.

## Resolución del juego

- **Resolución lógica:** 240×160 (resolución nativa de GBA)
- **Tile size:** 16×16 píxeles
- **Escala CSS:** El juego se escala automáticamente para pantallas modernas

---

## tileset.png

**Formato:** PNG con transparencia
**Tamaño recomendado:** 256×256 píxeles (16×16 tiles = 256 tiles totales)
**Rejilla:** 16×16 píxeles por tile

### Organización del tileset (índices)

| Índice | Tile | Descripción |
|--------|------|-------------|
| 0 | GRASS | Hierba base clara |
| 1 | GRASS2 | Hierba base variación |
| 2 | TALLGRASS | Hierba alta (encuentros) |
| 3 | PATH | Camino de tierra |
| 4 | WATER_A | Agua frame A (animación) |
| 5 | WATER_B | Agua frame B (animación) |
| 6 | FLOWER_R | Flor roja decorativa |
| 7 | FLOWER_Y | Flor amarilla decorativa |
| 8 | SIGN | Cartel/señal |
| 16-19 | TREE 2×2 | Árbol (TL, TR, BL, BR) |
| 32-47 | HOUSE | Casa (techo + paredes + puerta) |
| 48-63 | POKECENTER | Centro Pokémon |
| 64-79 | MART | Tienda |
| 80-95 | GYM | Gimnasio |

### Cómo crear el tileset

1. Usa un editor como Aseprite, GIMP o Photoshop
2. Crea un lienzo de 256×256 px
3. Dibuja cada tile en su celda de 16×16
4. Usa colores de la paleta GBA (limitada a 15 colores + transparente por tile)
5. Exporta como PNG con transparencia

---

## player.png

**Formato:** PNG con transparencia
**Tamaño:** 64×64 píxeles (4 columnas × 4 filas)
**Rejilla:** 16×16 píxeles por frame

### Organización del spritesheet

```
Columna:  0       1       2       3
         ┌───────┬───────┬───────┬───────┐
Fila 0   │ Down  │ Down  │ Up    │ Up    │
         │ idle  │ walk  │ idle  │ walk  │
         ├───────┼───────┼───────┼───────┤
Fila 1   │ Left  │ Left  │ Right │ Right │
         │ idle  │ walk  │ idle  │ walk  │
         └───────┴───────┴───────┴───────┘
```

### Direcciones

| Dir | Índice | Descripción |
|-----|--------|-------------|
| 0 | Down | Mirando abajo |
| 1 | Up | Mirando arriba |
| 2 | Left | Mirando izquierda |
| 3 | Right | Mirando derecha |

---

## npcs.png

**Formato:** PNG con transparencia
**Tamaño recomendado:** 128×64 píxeles (8 NPCs × 4 direcciones)
**Rejilla:** 16×16 píxeles por sprite

### Organización

Cada fila es un tipo de NPC, cada columna una dirección (Down, Up, Left, Right):

| Fila | NPC |
|------|-----|
| 0 | Professor (bata blanca) |
| 1 | Trainer (ropa azul) |
| 2 | Old Man (ropa marrón) |
| 3 | Mom (ropa rosa) |
| 4 | Gym Leader (ropa verde) |
| 5 | Champion (ropa roja/dorada) |

---

## font.png (opcional)

**Formato:** PNG con transparencia
**Tamaño:** 128×48 píxeles (16 columnas × 6 filas)
**Rejilla:** 8×8 píxeles por carácter

### Organización

Caracteres ASCII desde el espacio (32) en adelante:

```
Fila 0:  !"#$%&'()*+,-./
Fila 1: 0123456789:;<=>?
Fila 2: @ABCDEFGHIJKLMNO
Fila 3: PQRSTUVWXYZ[\]^_
Fila 4: `abcdefghijklmno
Fila 5: pqrstuvwxyz{|}~
```

Caracteres especiales (después del ASCII estándar):
- Flechas: ↑↓←→
- Símbolos Pokémon: ♂♀
- Acentos españoles: áéíóúñ¿¡

---

## Paleta de colores recomendada (estilo GBA)

```css
/* Hierba */
--grass-light: #9BE070;
--grass-mid: #6EC44A;
--grass-dark: #3E9A32;

/* Camino */
--path-light: #E6D08A;
--path-mid: #CDAA63;
--path-dark: #A68444;

/* Agua */
--water-light: #7FC8FF;
--water-mid: #3F8CF2;
--water-dark: #1E5FBF;

/* Árboles */
--tree-light: #4FC05A;
--tree-mid: #2F8E3A;
--tree-dark: #1F6A2B;
--tree-trunk: #B07A32;

/* Edificios */
--wall-light: #FFF2D8;
--wall-mid: #E9D6B9;
--roof-red: #E86860;
--roof-blue: #5A90E8;
--roof-green: #5FBF6A;

/* UI */
--ui-bg: #F8F8F8;
--ui-border: #1F2A44;
--ui-inner: #98B0C8;
```

---

## Fallback

Si los archivos PNG no existen, el juego genera los sprites proceduralmente usando canvas. Los PNGs mejoran la calidad visual y permiten personalización artística completa.

---

## Herramientas recomendadas

- **Aseprite** - Editor de pixel art profesional
- **Piskel** - Editor online gratuito
- **GIMP** - Editor de imágenes gratuito
- **Tiled** - Editor de mapas (para exportar tilemaps)
